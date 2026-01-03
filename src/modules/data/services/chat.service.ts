import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage } from '../schemas/chat.schema';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessage>,
    ) { }

    async create(role: 'user' | 'ai', content: string, sessionId: string = 'default-session'): Promise<ChatMessage> {
        const newMessage = new this.chatModel({ role, content, sessionId });
        return newMessage.save();
    }

    async findAll(sessionId: string = 'default-session'): Promise<ChatMessage[]> {
        return this.chatModel.find({ sessionId }).sort({ createdAt: 1 }).exec();
    }

    async clear(sessionId: string = 'default-session'): Promise<any> {
        return this.chatModel.deleteMany({ sessionId }).exec();
    }
}
