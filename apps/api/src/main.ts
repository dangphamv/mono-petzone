import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const captureRawBody = (req: unknown, _res: unknown, buf: Buffer) => {
    if (buf?.length) (req as { rawBody?: Buffer }).rawBody = buf;
  };
  app.use(json({ limit: '15mb', verify: captureRawBody as never }));
  app.use(urlencoded({ limit: '15mb', extended: true, verify: captureRawBody as never }));
  app.use(compression());
  app.use(helmet({ contentSecurityPolicy: false }));

  const origins = (
    process.env['CORS_ORIGINS'] ??
    process.env['WEB_URL'] ??
    'http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('PetZone API')
    .setDescription(
      'REST API for the PetZone pet hotel booking platform. ' +
      'This is the contract for the mobile team. ' +
      'Import the OpenAPI JSON from /api/docs-json into Postman or Insomnia.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token'
    )
    .addTag('Auth', 'Authentication & registration')
    .addTag('Users', 'User profile management')
    .addTag('Pets', 'Pet profile management')
    .addTag('Providers', 'Provider listing & management')
    .addTag('Search', 'Search & discovery')
    .addTag('Orders', 'Booking & order management')
    .addTag('Payments', 'Payment & escrow (v1, legacy)')
    .addTag('Payments v2', 'Payment & escrow via PSP (9Pay) with split payout')
    .addTag('Check-in', 'Photo check-in at handoff')
    .addTag('Status Reports', 'Daily status reports')
    .addTag('Chat', 'Real-time messaging')
    .addTag('Calls', 'Masked voice/video calls')
    .addTag('Reviews', 'Ratings & reviews')
    .addTag('Notifications', 'Push & in-app notifications')
    .addTag('Admin', 'Admin dashboard operations')
    .addTag('Upload', 'File upload')
    .addTag('Health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env['PORT'] ?? process.env['API_PORT'] ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.warn(`API running on http://localhost:${port}`);
  console.warn(`Swagger docs: http://localhost:${port}/api/docs`);
  console.warn(`OpenAPI JSON: http://localhost:${port}/api/docs-json`);
}

void bootstrap();
