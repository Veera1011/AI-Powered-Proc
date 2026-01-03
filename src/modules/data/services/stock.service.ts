import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stock, StockDocument } from '../schemas/stock.schema';
import { Sale, SaleDocument } from '../schemas/sale.schema';
import { Usage, UsageDocument } from '../schemas/usage.schema';

@Injectable()
export class StockService {
    constructor(
        @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
        @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
        @InjectModel(Usage.name) private usageModel: Model<UsageDocument>,
    ) { }

    async findAll(): Promise<Stock[]> {
        return this.stockModel.find().exec();
    }

    async findOne(id: string): Promise<Stock> {
        const stock = await this.stockModel.findById(id).exec();
        if (!stock) throw new NotFoundException('Stock item not found');
        return stock;
    }

    async create(createStockDto: any): Promise<Stock> {
        const newStock = new this.stockModel(createStockDto);
        return newStock.save();
    }

    async update(id: string, updateStockDto: any): Promise<Stock> {
        const updatedStock = await this.stockModel
            .findByIdAndUpdate(id, updateStockDto, { new: true })
            .exec();
        if (!updatedStock) throw new NotFoundException('Stock item not found');
        return updatedStock;
    }

    async delete(id: string): Promise<any> {
        return this.stockModel.findByIdAndDelete(id).exec();
    }

    async getInsights(id: string) {
        const stock = await this.findOne(id);
        const usage = await this.usageModel.find({ itemId: new Types.ObjectId(id) }).exec();

        // Simple average daily usage calculation (last 30 days or available data)
        if (usage.length === 0) return { daysRemaining: Infinity, avgDailyUsage: 0 };

        const totalUsage = usage.reduce((sum, u) => sum + u.quantity, 0);
        const firstUsageDate = new Date(usage[0].date).getTime();
        const lastUsageDate = new Date().getTime();
        const daysDiff = Math.max(1, (lastUsageDate - firstUsageDate) / (1000 * 60 * 60 * 24));

        const avgDailyUsage = totalUsage / daysDiff;
        const daysRemaining = avgDailyUsage > 0 ? stock.quantity / avgDailyUsage : Infinity;

        return {
            daysRemaining,
            avgDailyUsage,
            isLowStock: stock.quantity <= stock.threshold || daysRemaining < 7 // Alert if less than 7 days left
        };
    }
}
