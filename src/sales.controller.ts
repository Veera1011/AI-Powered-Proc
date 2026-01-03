import { Controller, Get, Post, Body } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSalesDto } from './dto/sales.dto';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    create(@Body() saleData: CreateSalesDto) {
        return this.salesService.create(saleData);
    }

    @Get()
    findAll() {
        return this.salesService.findAll();
    }

    @Get('most-selling')
    getMostSelling() {
        console.log('Fetching most selling items...');
        return this.salesService.getMostSelling();
    }
}
