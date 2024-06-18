import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { startBot } from './froggy-bot/bot';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Amazon API')
    .setDescription('The Amazon API description')
    .setVersion('1.0')
    .addTag('amazon')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

  // Start the Discord bot
  startBot();
}
bootstrap();
