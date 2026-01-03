import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { DataModule } from '../data/data.module';
import { FileService } from './services/file.service';

@Module({
    imports: [DataModule],
    controllers: [AgentController],
    providers: [AgentService, FileService],
})
export class AgentModule { }
