import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StockService } from './stock.service';
import { AgentService } from './agent.service';
import { CreateStockDto, UpdateStockDto } from './dto/stock.dto';

@Controller('stock')
export class StockController {
    constructor(
        private readonly stockService: StockService,
        private readonly agentService: AgentService
    ) { }

    @Get()
    findAll() {
        return this.stockService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.stockService.findOne(id);
    }

    @Post()
    create(@Body() createStockDto: CreateStockDto) {
        return this.stockService.create(createStockDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateStockDto: UpdateStockDto) {
        return this.stockService.update(id, updateStockDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.stockService.delete(id);
    }

    @Get(':id/insights')
    getInsights(@Param('id') id: string) {
        return this.stockService.getInsights(id);
    }

    @Post('scan')
    @UseInterceptors(FileInterceptor('file'))
    async scanBill(@UploadedFile() file: any) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        return this.agentService.analyzeBill(file.buffer, file.mimetype);
    }
}
