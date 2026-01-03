import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageDocument = Usage & Document;

@Schema()
export class Usage {
    @Prop({ type: Types.ObjectId, ref: 'Stock', required: true })
    itemId: Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true, default: Date.now })
    date: Date;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);
