import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmAgent, FunctionTool, InMemoryRunner, isFinalResponse } from '@google/adk';
import { createUserContent } from '@google/genai';
import { z } from 'zod';
import { StockService } from './stock.service';
import { SalesService } from './sales.service';
import { UsageService } from './usage.service';
import { procurementExpert } from './agents/procurement';

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

        const getMostSellingItems = new FunctionTool({
            name: 'get_most_selling_items',
            description: 'Get the top 5 most selling items based on sales data.',
            parameters: EmptyParams,
            execute: async () => {
                const items = await this.salesService.getMostSelling();
                return { data: items };
            },
        });

        const getMostUsedItems = new FunctionTool({
            name: 'get_most_used_items',
            description: 'Get the top 5 most used items based on internal consumption data.',
            parameters: EmptyParams,
            execute: async () => {
                const items = await this.usageService.getMostUsed();
                return { data: items };
            },
        });

        // Wire up tools to the statically exported agent
        this.agent.tools = [getStockSummary, getMostSellingItems, getMostUsedItems];

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
        const message = createUserContent(messageText) as any;
        let finalResponse = '';

        for await (const event of this.runner.runAsync({
            userId: this.USER_ID,
            sessionId: this.SESSION_ID,
            newMessage: message,
        })) {
            const e = event as any;
            if (isFinalResponse(e) && e.content?.parts?.length) {
                finalResponse = e.content.parts.map((p: any) => p.text || '').join('');
            }
        }

        return { text: finalResponse };
    }

    async analyzeBill(imageBuffer: Buffer, mimeType: string) {
        const prompt = `Analyze this procurement bill/receipt. Extract the following details for the main item appearing in it:
        - Item Name (name)
        - Quantity (quantity, number)
        - Unit (unit, string like 'pcs', 'kg')
        - Threshold (threshold, suggest a safe low stock alert level, number)
        
        Return ONLY a raw JSON object (no markdown) with keys: name, quantity, unit, threshold.`;

        const message = {
            role: 'user',
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: imageBuffer.toString('base64')
                    }
                }
            ]
        } as any;

        let finalResponse = '';

        try {
            for await (const event of this.runner.runAsync({
                userId: this.USER_ID,
                sessionId: this.SESSION_ID,
                newMessage: message,
            })) {
                const e = event as any;
                if (isFinalResponse(e) && e.content?.parts?.length) {
                    finalResponse = e.content.parts.map((p: any) => p.text || '').join('');
                }
            }

            if (!finalResponse) {
                throw new Error('No response from AI agent');
            }

            const jsonText = finalResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return { data: JSON.parse(jsonText) };

        } catch (error) {
            console.error('Error analyzing bill with ADK:', error);
            throw error;
        }
    }
}
