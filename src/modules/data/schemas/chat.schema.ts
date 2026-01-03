import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ChatMessage extends Document {
    @Prop({ required: true, enum: ['user', 'ai'] })
    role: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: 'default-session' })
    sessionId: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
