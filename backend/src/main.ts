import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors(); // Allow requests from Next.js frontend

  // Security Headers Initialization (protects against XSS, clickjacking, etc.)
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // Serve static files from the uploads directory
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Backup endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/backup/download', (req: any, res: any) => {
    const dbPath = path.resolve(__dirname, '..', 'prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      res.download(dbPath, 'backup-' + new Date().toISOString().split('T')[0] + '.db');
    } else {
      res.status(404).json({ message: 'Database file not found' });
    }
  });

  await app.listen(3001);
}
bootstrap();
