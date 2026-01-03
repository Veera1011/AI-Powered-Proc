import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { Stock, StockDocument } from './schemas/stock.schema';

@Injectable()
export class SalesService {
    constructor(
        @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
        @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    ) { }

    async create(saleData: any): Promise<Sale> {
        const sale = new this.saleModel(saleData);
        await this.stockModel.findByIdAndUpdate(saleData.itemId, {
            $inc: { quantity: -saleData.quantity },
        });
        return sale.save();
    }

    async findAll(): Promise<Sale[]> {
        return this.saleModel.find().populate('itemId').exec();
    }

    async getMostSelling() {
        try {
            console.log('Aggregation started for most selling...');
            const results = await this.saleModel.aggregate([
                {
                    $group: {
                        _id: '$itemId',
                        totalSold: { $sum: '$quantity' },
                    },
                },
                { $sort: { totalSold: -1 } },
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
            console.error('Aggregation failed:', error);
            throw error;
        }
    }
}
