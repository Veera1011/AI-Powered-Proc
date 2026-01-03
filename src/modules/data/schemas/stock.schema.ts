import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StockDocument = Stock & Document;

@Schema()
export class Stock {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, default: 0 })
    quantity: number;

    @Prop({ required: true, default: 10 })
    threshold: number;

    @Prop({ required: true })
    unit: string;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
