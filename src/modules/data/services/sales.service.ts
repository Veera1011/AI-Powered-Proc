import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument } from '../schemas/sale.schema';
import { Stock, StockDocument } from '../schemas/stock.schema';

@Injectable()
export class SalesService {
    constructor(
        @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
        @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    ) { }

    async create(saleData: any): Promise<Sale> {
        // Ensure itemId is an ObjectId
        if (typeof saleData.itemId === 'string') {
            saleData.itemId = new Types.ObjectId(saleData.itemId);
        }

        const sale = new this.saleModel(saleData);
        await this.stockModel.findByIdAndUpdate(saleData.itemId, {
            $inc: { quantity: -saleData.quantity },
        });
        return sale.save();
    }

    async findAll(): Promise<Sale[]> {
        return this.saleModel.find().populate('itemId').exec();
    }

    private getBaseAggregation() {
        return [
            {
                $group: {
                    _id: '$itemId',
                    totalSold: { $sum: '$quantity' }
                }
            },
            {
                // Robust casting: convert _id (itemId) to ObjectId for join
                $addFields: {
                    itemIdObj: { $toObjectId: '$_id' }
                }
            },
            {
                $lookup: {
                    from: 'stocks',
                    localField: 'itemIdObj',
                    foreignField: '_id',
                    as: 'item'
                }
            },
            { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
            {
                // Flatten structure for AI readability
                $project: {
                    _id: 1,
                    totalSold: 1,
                    itemName: '$item.name',
                    unit: '$item.unit'
                }
            }
        ];
    }

    async getMostSelling(limit = 5) {
        return this.saleModel.aggregate([
            ...this.getBaseAggregation(),
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);
    }

    async getLeastSelling(limit = 5) {
        return this.saleModel.aggregate([
            ...this.getBaseAggregation(),
            { $sort: { totalSold: 1 } },
            { $limit: limit }
        ]);
    }

    async getSalesSummary() {
        const top = await this.getMostSelling(5);
        const bottom = await this.getLeastSelling(5);
        return { top, bottom };
    }
}
