import { Controller, Post, Body, Get, Res, UseInterceptors, UploadedFile, Patch, Param, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Get('chat')
    async getChat(@Res() res: Response) {
        return res.redirect('/ui/index.html');
    }

    @Post('chat')
    async chat(@Body('message') message: string) {
        return this.agentService.chat(message);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any) {
        return this.agentService.handleFileUpload(file);
    }

    @Get('history')
    async getHistory() {
        return this.agentService.getHistory();
    }

    @Get('stocks')
    async getStocks() {
        return this.agentService.getStocks();
    }

    @Post('stocks')
    async createStock(@Body() data: any) {
        return this.agentService.createStock(data);
    }

    @Patch('stocks/:id')
    async updateStock(@Param('id') id: string, @Body() data: any) {
        return this.agentService.updateStock(id, data);
    }

    @Delete('stocks/:id')
    async deleteStock(@Param('id') id: string) {
        return this.agentService.deleteStock(id);
    }

    @Post('sales')
    async recordSale(@Body() data: any) {
        return this.agentService.recordSale(data);
    }

    @Get('prompt')
    getPrompt() {
        return { prompt: this.agentService.getPrompt() };
    }

    @Post('prompt')
    async updatePrompt(@Body('prompt') prompt: string) {
        return this.agentService.updatePrompt(prompt);
    }

    @Post('clear')
    async clearHistory() {
        return this.agentService.clearHistory();
    }
}
