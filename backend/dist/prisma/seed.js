"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminCode = '20192019';
    const hashedCode = await bcrypt.hash(adminCode, 10);
    const existingAdmin = await prisma.admin.findFirst();
    if (!existingAdmin) {
        await prisma.admin.create({
            data: {
                adminCodeHash: hashedCode,
            },
        });
        console.log('✅ Admin initialized successfully with code 20192019');
    }
    else {
        console.log('ℹ️ Admin already exists');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map