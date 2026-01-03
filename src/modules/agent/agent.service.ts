import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmAgent, FunctionTool, InMemoryRunner, isFinalResponse } from '@google/adk';
import { createUserContent } from '@google/genai';
import { StockService } from '../data/services/stock.service';
import { SalesService } from '../data/services/sales.service';
import { UsageService } from '../data/services/usage.service';
import { procurementExpert } from './definitions/procurement';
import { FileService } from './services/file.service';
import { ChatService } from '../data/services/chat.service';

@Injectable()
export class AgentService implements OnModuleInit {
    private runner: InMemoryRunner;
    private agent: LlmAgent = procurementExpert;
    private readonly APP_NAME = 'procurement_app';
    private readonly USER_ID = 'default_user';
    private readonly SESSION_ID = 'default_session';

    constructor(
        private stockService: StockService,
        private salesService: SalesService,
        private usageService: UsageService,
        private configService: ConfigService,
        private fileService: FileService,
        private chatService: ChatService,
    ) { }

    async onModuleInit() {
        const EmptyParams = { type: 'object', properties: {} } as any;

        const getStockSummary = new FunctionTool({
            name: 'get_stock_summary',
            description: 'Get a summary of all stock items including quantities and units.',
            parameters: EmptyParams,
            execute: async () => {
                const stocks = await this.stockService.findAll();
                return { data: stocks };
            },
        });

        const getSalesAnalytics = new FunctionTool({
            name: 'get_sales_analytics',
            description: 'Get an analysis of sales performance, including top-selling and worst-performing items.',
            parameters: EmptyParams,
            execute: async () => {
                return await this.salesService.getSalesSummary();
            }
        });

        const getSalesHistory = new FunctionTool({
            name: 'get_sales_history',
            description: 'Get a list of recent sales transactions including item names, quantities, and dates.',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Number of recent sales to fetch' },
                    itemId: { type: 'string', description: 'Optional itemId to filter' }
                }
            } as any,
            execute: async ({ limit, itemId }: { limit?: number, itemId?: string }) => {
                return await this.salesService.findAll(); // Simplified for now, SalesService.findAll already populates
            }
        });

        const saveStockItems = new FunctionTool({
            name: 'save_stock_items',
            description: 'Save extracted stock items to the database.',
            parameters: {
                type: 'object',
                properties: {
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                quantity: { type: 'number' },
                                unit: { type: 'string' },
                                threshold: { type: 'number' }
                            },
                            required: ['name', 'quantity', 'unit']
                        }
                    }
                },
                required: ['items']
            } as any,
            execute: async ({ items }: { items: any[] }) => {
                const saved: any[] = [];
                for (const item of items) {
                    saved.push(await this.stockService.create(item));
                }
                return { message: `Successfully saved ${saved.length} items to stock.` };
            }
        });

        const saveSalesItems = new FunctionTool({
            name: 'save_sales_items',
            description: 'Save extracted sales data to the database.',
            parameters: {
                type: 'object',
                properties: {
                    sales: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                itemName: { type: 'string' },
                                quantity: { type: 'number' },
                                date: { type: 'string' }
                            },
                            required: ['itemName', 'quantity']
                        }
                    }
                },
                required: ['sales']
            } as any,
            execute: async ({ sales }: { sales: any[] }) => {
                const stocks = await this.stockService.findAll();
                const saved: any[] = [];
                for (const sale of sales) {
                    const stock = stocks.find(s => s.name.toLowerCase() === sale.itemName.toLowerCase());
                    if (stock) {
                        saved.push(await this.salesService.create({
                            itemId: (stock as any)._id,
                            quantity: sale.quantity,
                            date: sale.date ? new Date(sale.date) : new Date()
                        }));
                    }
                }
                return { message: `Successfully saved ${saved.length} sales records.` };
            }
        });

        const renderChart = new FunctionTool({
            name: 'render_chart',
            description: 'Render a visual chart (line, bar, or pie) for sales data or inventory analytics.',
            parameters: {
                type: 'object',
                properties: {
                    chartType: { type: 'string', enum: ['line', 'bar', 'pie'], description: 'Type of chart to render' },
                    title: { type: 'string', description: 'Title of the chart' },
                    labels: { type: 'array', items: { type: 'string' }, description: 'Labels for the X-axis' },
                    datasets: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string' },
                                data: { type: 'array', items: { type: 'number' } },
                                backgroundColor: { type: 'string' },
                                borderColor: { type: 'string' }
                            }
                        }
                    }
                },
                required: ['chartType', 'title', 'labels', 'datasets']
            } as any,
            execute: async (params: any) => {
                // Return a special payload that the frontend script will catch and render
                return {
                    _type: 'visual_chart',
                    ...params
                };
            }
        });

        this.agent.tools = [
            getStockSummary,
            saveStockItems,
            saveSalesItems,
            getSalesAnalytics,
            getSalesHistory,
            renderChart
        ];

        this.runner = new InMemoryRunner({
            appName: this.APP_NAME,
            agent: this.agent,
        });

        await this.runner.sessionService.createSession({
            appName: this.APP_NAME,
            userId: this.USER_ID,
            sessionId: this.SESSION_ID,
        });
    }

    async chat(messageText: string) {
        // Save new user message
        await this.chatService.create('user', messageText, this.SESSION_ID);
        const message = createUserContent(messageText) as any;
        return this.runAgent(message);
    }

    async getHistory() {
        return this.chatService.findAll(this.SESSION_ID);
    }

    async clearHistory() {
        return this.chatService.clear(this.SESSION_ID);
    }

    async getStocks() {
        return this.stockService.findAll();
    }

    async createStock(data: any) {
        return this.stockService.create(data);
    }

    async updateStock(id: string, data: any) {
        return this.stockService.update(id, data);
    }

    async deleteStock(id: string) {
        return this.stockService.delete(id);
    }

    async recordSale(data: any) {
        return this.salesService.create(data);
    }

    getPrompt() {
        return this.agent.instruction || '';
    }

    async updatePrompt(text: string) {
        this.agent.instruction = text;
        // Re-initialize runner to apply changes instantly
        this.runner = new InMemoryRunner({
            appName: this.APP_NAME,
            agent: this.agent,
        });
        await this.runner.sessionService.createSession({
            appName: this.APP_NAME,
            userId: this.USER_ID,
            sessionId: this.SESSION_ID,
        });
        return { message: 'Prompt updated successfully' };
    }

    async handleFileUpload(file: any) {
        if (!file) throw new Error('No file uploaded');

        const prompt = `
            A user has uploaded a procurement document: "${file.originalname}".
            
            EXTRACT and ANALYZE:
            1. Extract all stock items, quantities, and units from the file.
            2. Use the 'get_stock_summary' tool to fetch the current inventory state.
            3. COMPARE the extracted data with the current inventory.
            
            PRESENTATION:
            Display a professional Markdown table comparing the current stock vs the new data found in the file:
            | Item | Current Qty | New Qty | Status |
            
            CRITICAL INSTRUCTIONS:
            - DO NOT save the data yet. 
            - DO NOT use the 'save_stock_items' tool until the user explicitly confirms (e.g., "Yes, update" or "Proceed").
            - Ask the user: "Would you like to update the database with this new information, or do you have any questions about the extracted data?"
        `;

        const fileData = {
            role: 'user',
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: file.mimetype,
                        data: file.buffer.toString('base64')
                    }
                }
            ]
        } as any;

        // Save file upload "pseudo-message" to history
        await this.chatService.create('user', `Uploaded file: ${file.originalname}`, this.SESSION_ID);

        return this.runAgent(fileData);
    }

    private async runAgent(message: any) {
        let finalResponse = '';
        const charts: any[] = [];

        for await (const event of this.runner.runAsync({
            userId: this.USER_ID,
            sessionId: this.SESSION_ID,
            newMessage: message,
        })) {
            const e = event as any;

            // Capture tool output for charts
            if (e.type === 'tool_execution' && e.result?._type === 'visual_chart') {
                charts.push(e.result);
            }

            if (isFinalResponse(e) && e.content?.parts?.length) {
                finalResponse = e.content.parts.map((p: any) => p.text || '').join('');
            }
        }

        // Save AI response
        if (finalResponse) {
            await this.chatService.create('ai', finalResponse, this.SESSION_ID);
        }

        return { text: finalResponse, charts };
    }
}
