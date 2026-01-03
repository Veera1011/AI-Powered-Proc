import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Stock, StockSchema } from './schemas/stock.schema';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { Usage, UsageSchema } from './schemas/usage.schema';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Stock.name, schema: StockSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Usage.name, schema: UsageSchema },
    ]),
  ],
  controllers: [
    AppController,
    StockController,
    SalesController,
    UsageController,
    AgentController,
  ],
  providers: [
    AppService,
    StockService,
    SalesService,
    UsageService,
    AgentService,
  ],
})
export class AppModule { }
