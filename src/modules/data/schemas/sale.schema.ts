import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema()
export class Sale {
    @Prop({ type: Types.ObjectId, ref: 'Stock', required: true })
    itemId: Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true, default: Date.now })
    date: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
