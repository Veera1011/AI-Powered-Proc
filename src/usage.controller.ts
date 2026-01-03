import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsageService } from './usage.service';
import { CreateUsageDto } from './dto/usage.dto';

@Controller('usage')
export class UsageController {
    constructor(private readonly usageService: UsageService) { }

    @Post()
    create(@Body() usageData: CreateUsageDto) {
        return this.usageService.create(usageData);
    }

    @Get()
    findAll() {
        return this.usageService.findAll();
    }

    @Get('most-used')
    getMostUsed() {
        return this.usageService.getMostUsed();
    }
}
