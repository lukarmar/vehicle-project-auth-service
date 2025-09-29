import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Authentication service for Vehicle Resale Platform')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'OK',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🔐 Auth Service is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();