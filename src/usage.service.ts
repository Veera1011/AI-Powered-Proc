import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usage, UsageDocument } from './schemas/usage.schema';
import { Stock, StockDocument } from './schemas/stock.schema';

@Injectable()
export class UsageService {
    constructor(
        @InjectModel(Usage.name) private usageModel: Model<UsageDocument>,
        @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    ) { }

    async create(usageData: any): Promise<Usage> {
        const usage = new this.usageModel(usageData);
        await this.stockModel.findByIdAndUpdate(usageData.itemId, {
            $inc: { quantity: -usageData.quantity },
        });
        return usage.save();
    }

    async findAll(): Promise<Usage[]> {
        return this.usageModel.find().populate('itemId').exec();
    }

    async getMostUsed() {
        try {
            console.log('Aggregation started for most used...');
            const results = await this.usageModel.aggregate([
                {
                    $group: {
                        _id: '$itemId',
                        totalUsed: { $sum: '$quantity' },
                    },
                },
                { $sort: { totalUsed: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'stocks',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'item',
                    },
                },
                { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
            ]);
            console.log(`Aggregation finished. Found ${results.length} items.`);
            return results;
        } catch (error) {
            console.error('Usage aggregation failed:', error);
            throw error;
        }
    }
}
