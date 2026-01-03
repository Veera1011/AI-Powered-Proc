import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ChatService } from './modules/data/services/chat.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const chatService = app.get(ChatService);
    const history = await chatService.findAll('default-session');

    console.log('--- CHAT HISTORY START ---');
    history.forEach((msg, i) => {
        console.log(`[${i + 1}] ${msg.role.toUpperCase()}: ${msg.content}`);
    });
    console.log('--- CHAT HISTORY END ---');

    await app.close();
}
bootstrap();
