"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const fs = require("fs");
const path = require("path");
const helmet_1 = require("helmet");
async function bootstrap() {
    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/backup/download', (req, res) => {
        const dbPath = path.resolve(__dirname, '..', 'prisma', 'dev.db');
        if (fs.existsSync(dbPath)) {
            res.download(dbPath, 'backup-' + new Date().toISOString().split('T')[0] + '.db');
        }
        else {
            res.status(404).json({ message: 'Database file not found' });
        }
    });
    await app.listen(3001);
}
bootstrap();
//# sourceMappingURL=main.js.map