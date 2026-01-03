import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from './schemas/stock.schema';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { Usage, UsageSchema } from './schemas/usage.schema';
import { StockService } from './services/stock.service';
import { SalesService } from './services/sales.service';
import { UsageService } from './services/usage.service';
import { ChatMessage, ChatMessageSchema } from './schemas/chat.schema';
import { ChatService } from './services/chat.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Stock.name, schema: StockSchema },
            { name: Sale.name, schema: SaleSchema },
            { name: Usage.name, schema: UsageSchema },
            { name: ChatMessage.name, schema: ChatMessageSchema },
        ]),
    ],
    providers: [StockService, SalesService, UsageService, ChatService],
    exports: [StockService, SalesService, UsageService, ChatService],
})
export class DataModule { }
