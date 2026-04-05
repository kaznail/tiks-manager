"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submitReport(employeeId, tiktokUrl) {
        const validDomains = [
            'tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com', 'lite.tiktok.com',
            'instagram.com', 'instagr.am',
            'youtube.com', 'youtu.be',
            'facebook.com', 'fb.com', 'fb.watch',
        ];
        const isValid = validDomains.some(domain => tiktokUrl.toLowerCase().includes(domain));
        if (!isValid) {
            throw new common_1.BadRequestException('رابط غير صالح. يرجى إدخال رابط من منصة صحيحة.');
        }
        const today = new Date().toISOString().split('T')[0];
        const existingUrl = await this.prisma.report.findUnique({ where: { tiktokUrl } });
        if (existingUrl) {
            throw new common_1.BadRequestException('❌ هذا الرابط تم إرساله مسبقاً في النظام.');
        }
        const links = await this.prisma.accountLink.findMany({ where: { employeeId } });
        if (links.length === 0) {
            throw new common_1.BadRequestException('⚠️ لم تقم بربط حساباتك! يرجى الذهاب إلى (ملفي الشخصي) وإضافة روابط حساباتك قبل إرسال التقارير.');
        }
        const urlLower = tiktokUrl.toLowerCase();
        const platformMap = {
            'tiktok': ['tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com', 'lite.tiktok.com'],
            'instagram': ['instagram.com', 'instagr.am'],
            'youtube': ['youtube.com', 'youtu.be', 'youtube.com/shorts'],
            'facebook': ['facebook.com', 'fb.com', 'fb.watch'],
        };
        let submittedPlatform = '';
        for (const [platform, domains] of Object.entries(platformMap)) {
            if (domains.some(d => urlLower.includes(d))) {
                submittedPlatform = platform;
                break;
            }
        }
        const urlUsernameMatch = urlLower.match(/@([a-zA-Z0-9_.-]+)/);
        let isOwner = false;
        for (const link of links) {
            const linkLower = link.url.toLowerCase();
            const linkUsernameMatch = linkLower.match(/@([a-zA-Z0-9_.-]+)/);
            if (urlUsernameMatch && linkUsernameMatch) {
                if (urlUsernameMatch[1] === linkUsernameMatch[1]) {
                    isOwner = true;
                    break;
                }
            }
            else if (!urlUsernameMatch && submittedPlatform) {
                const linkPlatform = Object.entries(platformMap).find(([_, domains]) => domains.some(d => linkLower.includes(d)));
                if (linkPlatform && linkPlatform[0] === submittedPlatform) {
                    isOwner = true;
                    break;
                }
            }
            else {
                const cleanUrl = linkLower.replace('https://', '').replace('http://', '').trim();
                if (cleanUrl.length > 5 && urlLower.includes(cleanUrl)) {
                    isOwner = true;
                    break;
                }
            }
        }
        if (!isOwner) {
            throw new common_1.BadRequestException('❌ الرابط المرفق لا يعود لأي من حساباتك المسجلة لدينا. تأكد من إرسال فيديوهات حسابك فقط.');
        }
        const report = await this.prisma.report.create({
            data: {
                employeeId,
                tiktokUrl,
                dateString: today,
                status: 'PENDING',
            }
        });
        return report;
    }
    async getPendingReports() {
        return this.prisma.report.findMany({
            where: { status: 'PENDING' },
            include: { employee: { select: { id: true, name: true, fullName: true, platform: true } } },
            orderBy: { submittedAt: 'asc' },
        });
    }
    async approveReport(id) {
        const report = await this.prisma.report.findUnique({ where: { id } });
        if (!report || report.status !== 'PENDING')
            throw new common_1.BadRequestException('التقرير غير صالح أو تم تقييمه مسبقاً.');
        await this.prisma.report.update({
            where: { id },
            data: { status: 'APPROVED' }
        });
        const month = report.dateString.substring(0, 7);
        const emp = await this.prisma.employee.findUnique({ where: { id: report.employeeId } });
        await this.prisma.monthlyTarget.upsert({
            where: { employeeId_month: { employeeId: report.employeeId, month } },
            update: { achievedCount: { increment: 1 } },
            create: {
                employeeId: report.employeeId,
                month,
                targetCount: emp?.monthlyVideoTarget || 0,
                achievedCount: 1,
            }
        });
        return { success: true };
    }
    async rejectReport(id) {
        return this.prisma.report.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
    }
    async getReports() {
        return this.prisma.report.findMany({
            include: { employee: { select: { id: true, name: true, fullName: true, platform: true } } },
            orderBy: { submittedAt: 'desc' },
        });
    }
    async handleMissingReports() {
        console.log('Running daily missing reports check...');
        const today = new Date().toISOString().split('T')[0];
        const employees = await this.prisma.employee.findMany({
            where: { role: 'employee' }
        });
        for (const emp of employees) {
            const report = await this.prisma.report.findFirst({
                where: { employeeId: emp.id, dateString: today }
            });
            if (!report) {
                await this.prisma.warningRequest.create({
                    data: {
                        employeeId: emp.id,
                        type: 'عدم إرسال تقرير',
                        reason: `لم يقم الموظف ${emp.name} بإرسال تقريره اليومي بتاريخ ${today}`,
                        autoGenerated: true,
                    }
                });
                const existingAtt = await this.prisma.attendanceRecord.findUnique({
                    where: { employeeId_date: { employeeId: emp.id, date: today } }
                });
                if (!existingAtt) {
                    await this.prisma.attendanceRecord.create({
                        data: {
                            employeeId: emp.id,
                            date: today,
                            status: 'ABSENT',
                            videoCount: 0,
                        }
                    });
                }
                await this.prisma.notification.create({
                    data: {
                        employeeId: emp.id,
                        message: `⚠️ تحذير تلقائي: ${emp.name} لم يرسل تقريره اليوم. ينتظر موافقتك في صفحة التحذيرات.`,
                        isAdminOnly: true,
                    }
                });
            }
        }
    }
};
exports.ReportsService = ReportsService;
__decorate([
    (0, schedule_1.Cron)('59 23 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsService.prototype, "handleMissingReports", null);
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map