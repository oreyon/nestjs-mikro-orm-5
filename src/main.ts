import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const configService = new ConfigService();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.use(
    cookieParser([
      `${configService.get('JWT_ACCESS_TOKEN_SECRET')}`,
      `${configService.get('JWT_REFRESH_TOKEN_SECRET')}`,
    ]),
  );
  app.useLogger(logger);
  app.enableCors({
    origin: [configService.get<string>('IP_FRONTEND_ORIGIN')],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'accessToken',
      'refreshToken',
    ],
    credentials: true,
  });
  app.set('trust proxy', 1);
  app.enableShutdownHooks();
  const config = new DocumentBuilder()
    .setTitle('Contacts Apps API')
    .setDescription('Contacts APP API Documentation')
    .setVersion('1.0')
    .addTag('contact')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
