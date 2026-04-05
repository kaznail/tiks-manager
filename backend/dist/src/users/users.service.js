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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
const firebase_service_1 = require("./firebase.service");
let UsersService = class UsersService {
    constructor(prisma, firebaseService) {
        this.prisma = prisma;
        this.firebaseService = firebaseService;
    }
    async findAll() {
        return this.prisma.employee.findMany({
            include: {
                _count: {
                    select: { reports: true, warnings: true, salaryRecords: true, rewards: true, accountLinks: true, attendance: true }
                }
            }
        });
    }
    async createEmployee(data) {
        const existing = await this.prisma.employee.findUnique({ where: { username: data.username } });
        if (existing)
            throw new common_1.BadRequestException('Username already taken');
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const emp = await this.prisma.employee.create({
            data: {
                name: data.name,
                fullName: data.fullName,
                username: data.username,
                password: hashedPassword,
                salary: parseFloat(data.salary) || 0,
                age: parseInt(data.age) || null,
                education: data.education,
                province: data.province,
                gender: data.gender,
                masterCard: data.masterCard,
                platform: data.platform,
                allowedLeaves: data.allowedLeaves !== undefined ? parseInt(data.allowedLeaves) : 21,
                photo1: data.photo1,
                photo2: data.photo2,
                photo3: data.photo3,
                accountLinks: data.accountLinks && Array.isArray(data.accountLinks) ? {
                    create: data.accountLinks.map((url) => ({ url }))
                } : undefined,
            }
        });
        await this.logActivity('إنشاء موظف جديد', `تم إنشاء حساب للموظف: ${data.name}`);
        return emp;
    }
    async updateEmployee(id, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.fullName !== undefined)
            updateData.fullName = data.fullName;
        if (data.age !== undefined)
            updateData.age = parseInt(data.age) || null;
        if (data.education !== undefined)
            updateData.education = data.education;
        if (data.province !== undefined)
            updateData.province = data.province;
        if (data.gender !== undefined)
            updateData.gender = data.gender;
        if (data.masterCard !== undefined)
            updateData.masterCard = data.masterCard;
        if (data.platform !== undefined)
            updateData.platform = data.platform;
        if (data.allowedLeaves !== undefined)
            updateData.allowedLeaves = parseInt(data.allowedLeaves) || 21;
        if (data.salary !== undefined) {
            const oldEmp = await this.prisma.employee.findUnique({ where: { id } });
            const newSalary = parseFloat(data.salary) || 0;
            if (oldEmp && oldEmp.salary !== newSalary) {
                await this.prisma.salaryChangeLog.create({
                    data: { employeeId: id, oldSalary: oldEmp.salary || 0, newSalary, reason: data.salaryChangeReason || 'تعديل إداري' }
                });
            }
            updateData.salary = newSalary;
        }
        if (data.monthlyVideoTarget !== undefined)
            updateData.monthlyVideoTarget = parseInt(data.monthlyVideoTarget) || null;
        if (data.photo1)
            updateData.photo1 = data.photo1;
        if (data.photo2)
            updateData.photo2 = data.photo2;
        if (data.photo3)
            updateData.photo3 = data.photo3;
        await this.logActivity('تعديل بيانات موظف', `تم تعديل بيانات الموظف ID: ${id}`);
        return this.prisma.employee.update({ where: { id }, data: updateData });
    }
    async deleteEmployee(id) {
        await this.prisma.report.deleteMany({ where: { employeeId: id } });
        await this.prisma.warning.deleteMany({ where: { employeeId: id } });
        await this.prisma.reward.deleteMany({ where: { employeeId: id } });
        await this.prisma.notification.deleteMany({ where: { employeeId: id } });
        await this.prisma.accountLink.deleteMany({ where: { employeeId: id } });
        await this.prisma.salaryRecord.deleteMany({ where: { employeeId: id } });
        await this.prisma.warningRequest.deleteMany({ where: { employeeId: id } });
        await this.prisma.attendanceRecord.deleteMany({ where: { employeeId: id } });
        await this.prisma.chatMessage.deleteMany({ where: { employeeId: id } });
        await this.prisma.performanceReview.deleteMany({ where: { employeeId: id } });
        await this.prisma.contract.deleteMany({ where: { employeeId: id } });
        await this.prisma.note.deleteMany({ where: { employeeId: id } });
        await this.prisma.monthlyTarget.deleteMany({ where: { employeeId: id } });
        await this.prisma.leaveRequest.deleteMany({ where: { employeeId: id } });
        await this.prisma.salaryChangeLog.deleteMany({ where: { employeeId: id } });
        await this.logActivity('حذف موظف', `تم حذف الموظف ID: ${id}`);
        return this.prisma.employee.delete({ where: { id } });
    }
    async findOne(id) {
        return this.prisma.employee.findUnique({
            where: { id },
            include: {
                reports: { orderBy: { submittedAt: 'desc' } },
                warnings: { orderBy: { issuedAt: 'desc' } },
                rewards: { orderBy: { issuedAt: 'desc' } },
                receivedNotes: { orderBy: { createdAt: 'desc' } },
                salaryRecords: { orderBy: { paidAt: 'desc' } },
                accountLinks: true,
                attendance: { orderBy: { date: 'desc' }, take: 30 },
                performanceReviews: { orderBy: { month: 'desc' } },
                contracts: { orderBy: { createdAt: 'desc' } },
                warningRequests: { orderBy: { createdAt: 'desc' } },
                monthlyTargets: { orderBy: { month: 'desc' }, take: 6 },
                leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
                salaryChangeLogs: { orderBy: { changedAt: 'desc' } },
            }
        });
    }
    async addSalaryRecord(id, body) {
        await this.logActivity('إصدار راتب', `تم تسليم راتب بمبلغ ${body.amount} للموظف ID: ${id}`);
        return this.prisma.salaryRecord.create({
            data: { employeeId: id, amount: parseFloat(body.amount) || 0, notes: body.notes }
        });
    }
    async addAccountLink(id, body) {
        return this.prisma.accountLink.create({
            data: { employeeId: id, url: body.url, platform: body.platform }
        });
    }
    async addWarning(id, body) {
        await this.logActivity('إصدار تحذير', `تم إصدار تحذير للموظف ID: ${id} — ${body.type}`);
        return this.prisma.warning.create({
            data: { employeeId: id, type: body.type, reason: body.reason }
        });
    }
    async createWarningRequest(employeeId, type, reason, autoGenerated = false) {
        return this.prisma.warningRequest.create({
            data: { employeeId, type, reason, autoGenerated }
        });
    }
    async getPendingWarningRequests() {
        return this.prisma.warningRequest.findMany({
            where: { status: 'PENDING' },
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, platform: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAllWarningRequests() {
        return this.prisma.warningRequest.findMany({
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async approveWarningRequest(requestId) {
        const req = await this.prisma.warningRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED', reviewedAt: new Date() }
        });
        await this.addWarning(req.employeeId, { type: req.type, reason: req.reason });
        await this.createNotification(req.employeeId, `تم إصدار تحذير بحقك: ${req.type} — ${req.reason}`, 'تحذير إداري ⚠️');
        await this.logActivity('الموافقة على تحذير', `تمت الموافقة على طلب التحذير ID: ${requestId}`);
        return req;
    }
    async rejectWarningRequest(requestId) {
        await this.logActivity('رفض تحذير', `تم رفض طلب التحذير ID: ${requestId}`);
        return this.prisma.warningRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', reviewedAt: new Date() }
        });
    }
    async removeWarning(warningId) {
        await this.logActivity('رفع تحذير', `تم رفع التحذير ID: ${warningId}`);
        return this.prisma.warning.delete({ where: { id: warningId } });
    }
    async addReward(id, body) {
        await this.logActivity('إضافة مكافأة', `تم منح مكافأة للموظف ID: ${id}`);
        return this.prisma.reward.create({
            data: { employeeId: id, reason: body.reason }
        });
    }
    async addNote(id, body) {
        return this.prisma.note.create({
            data: { employeeId: id, content: body.content }
        });
    }
    async saveFcmToken(id, token) {
        return this.prisma.employee.update({ where: { id }, data: { fcmToken: token } });
    }
    async createNotification(employeeId, message, title, isAdminOnly = false) {
        const notif = await this.prisma.notification.create({
            data: { employeeId, message: `${title ? title + ': ' : ''}${message}`, isAdminOnly }
        });
        if (!isAdminOnly) {
            const user = await this.prisma.employee.findUnique({ where: { id: employeeId } });
            if (user && user.fcmToken) {
                await this.firebaseService.sendPushNotification(user.fcmToken, title || 'رسالة إدارية', message);
            }
        }
        return notif;
    }
    async deleteNotification(id) {
        return this.prisma.notification.delete({ where: { id } });
    }
    async getAdminNotifications() {
        return this.prisma.notification.findMany({
            include: { employee: { select: { name: true, fullName: true, id: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
    async getEmployeeNotifications(employeeId) {
        return this.prisma.notification.findMany({
            where: { employeeId, isAdminOnly: false },
            orderBy: { createdAt: 'desc' }
        });
    }
    async markNotificationRead(id) {
        return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    }
    async recordAttendance(employeeId, videoLinks, notes) {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.prisma.attendanceRecord.findUnique({
            where: { employeeId_date: { employeeId, date: today } }
        });
        if (existing) {
            const oldLinks = existing.videoLinks ? JSON.parse(existing.videoLinks) : [];
            const allLinks = [...oldLinks, ...videoLinks];
            return this.prisma.attendanceRecord.update({
                where: { id: existing.id },
                data: { videoLinks: JSON.stringify(allLinks), videoCount: allLinks.length }
            });
        }
        return this.prisma.attendanceRecord.create({
            data: {
                employeeId,
                date: today,
                status: 'PRESENT',
                videoLinks: JSON.stringify(videoLinks),
                videoCount: videoLinks.length,
                notes
            }
        });
    }
    async getEmployeeAttendance(employeeId) {
        return this.prisma.attendanceRecord.findMany({
            where: { employeeId },
            orderBy: { date: 'desc' },
            take: 60
        });
    }
    async getAllAttendanceToday() {
        const today = new Date().toISOString().split('T')[0];
        return this.prisma.attendanceRecord.findMany({
            where: { date: today },
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true } } }
        });
    }
    async sendChatMessage(employeeId, content, isFromAdmin) {
        return this.prisma.chatMessage.create({
            data: { employeeId, content, isFromAdmin }
        });
    }
    async getChatMessages(employeeId) {
        await this.prisma.chatMessage.updateMany({
            where: { employeeId, isFromAdmin: false, isRead: false },
            data: { isRead: true }
        });
        return this.prisma.chatMessage.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'asc' }
        });
    }
    async getEmployeeChatMessages(employeeId) {
        await this.prisma.chatMessage.updateMany({
            where: { employeeId, isFromAdmin: true, isRead: false },
            data: { isRead: true }
        });
        return this.prisma.chatMessage.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'asc' }
        });
    }
    async getUnreadCountForAdmin() {
        return this.prisma.chatMessage.count({
            where: { isFromAdmin: false, isRead: false }
        });
    }
    async getUnreadCountForEmployee(employeeId) {
        return this.prisma.chatMessage.count({
            where: { employeeId, isFromAdmin: true, isRead: false }
        });
    }
    async logActivity(action, details) {
        return this.prisma.activityLog.create({
            data: { action, details }
        });
    }
    async getActivityLogs(take = 100) {
        return this.prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take
        });
    }
    async addPerformanceReview(employeeId, month, rating, notes) {
        await this.logActivity('تقييم أداء', `تم تقييم الموظف ID: ${employeeId} لشهر ${month} بتقييم ${rating}/5`);
        return this.prisma.performanceReview.upsert({
            where: { employeeId_month: { employeeId, month } },
            update: { rating, notes },
            create: { employeeId, month, rating, notes }
        });
    }
    async getPerformanceReviews(employeeId) {
        return this.prisma.performanceReview.findMany({
            where: { employeeId },
            orderBy: { month: 'desc' }
        });
    }
    async addContract(employeeId, title, filePath) {
        await this.logActivity('رفع عقد', `تم رفع عقد "${title}" للموظف ID: ${employeeId}`);
        return this.prisma.contract.create({
            data: { employeeId, title, filePath }
        });
    }
    async deleteContract(id) {
        return this.prisma.contract.delete({ where: { id } });
    }
    async createEvent(title, date, type, description) {
        await this.logActivity('إضافة حدث', `تم إضافة حدث: ${title} بتاريخ ${date}`);
        return this.prisma.calendarEvent.create({
            data: { title, date, type: type || 'عام', description }
        });
    }
    async getEvents() {
        return this.prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } });
    }
    async deleteEvent(id) {
        return this.prisma.calendarEvent.delete({ where: { id } });
    }
    async getSetting(key) {
        return this.prisma.systemSettings.findUnique({ where: { key } });
    }
    async setSetting(key, value) {
        return this.prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    }
    async getAllSettings() {
        return this.prisma.systemSettings.findMany();
    }
    async getStats() {
        const totalEmployees = await this.prisma.employee.count();
        const totalReports = await this.prisma.report.count();
        const totalWarnings = await this.prisma.warning.count();
        const totalRewards = await this.prisma.reward.count();
        const totalSalaryPaid = await this.prisma.salaryRecord.aggregate({ _sum: { amount: true } });
        const pendingWarnings = await this.prisma.warningRequest.count({ where: { status: 'PENDING' } });
        const today = new Date().toISOString().split('T')[0];
        const attendanceToday = await this.prisma.attendanceRecord.count({ where: { date: today } });
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = await this.prisma.report.count({ where: { dateString: dateStr } });
            last7Days.push({ date: dateStr, count });
        }
        return {
            totalEmployees,
            totalReports,
            totalWarnings,
            totalRewards,
            totalSalaryPaid: totalSalaryPaid._sum.amount || 0,
            pendingWarnings,
            attendanceToday,
            reportsLast7Days: last7Days,
        };
    }
    async setMonthlyTarget(employeeId, month, targetCount) {
        await this.logActivity('تحديد هدف شهري', `تم تحديد ${targetCount} فيديو كهدف للموظف ID: ${employeeId} لشهر ${month}`);
        return this.prisma.monthlyTarget.upsert({
            where: { employeeId_month: { employeeId, month } },
            update: { targetCount },
            create: { employeeId, month, targetCount }
        });
    }
    async getMonthlyTarget(employeeId, month) {
        return this.prisma.monthlyTarget.findUnique({
            where: { employeeId_month: { employeeId, month } }
        });
    }
    async updateTargetAchieved(employeeId, increment) {
        const month = new Date().toISOString().substring(0, 7);
        const target = await this.prisma.monthlyTarget.findUnique({
            where: { employeeId_month: { employeeId, month } }
        });
        if (target) {
            return this.prisma.monthlyTarget.update({
                where: { id: target.id },
                data: { achievedCount: { increment } }
            });
        }
        return null;
    }
    async getAllMonthlyTargets(month) {
        return this.prisma.monthlyTarget.findMany({
            where: { month },
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, platform: true, monthlyVideoTarget: true } } }
        });
    }
    async createLeaveRequest(employeeId, data) {
        if (data.endDate < data.startDate) {
            throw new common_1.BadRequestException('تاريخ نهاية الإجازة يجب أن يكون بعد تاريخ البداية');
        }
        const existing = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: { not: 'REJECTED' },
                OR: [
                    { startDate: { lte: data.endDate }, endDate: { gte: data.startDate } }
                ]
            }
        });
        if (existing) {
            throw new common_1.BadRequestException('يوجد طلب إجازة متداخل مع هذه الفترة بالفعل');
        }
        return this.prisma.leaveRequest.create({
            data: { employeeId, startDate: data.startDate, endDate: data.endDate, reason: data.reason, type: data.type || 'عادية' }
        });
    }
    async getPendingLeaveRequests() {
        return this.prisma.leaveRequest.findMany({
            where: { status: 'PENDING' },
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, platform: true, allowedLeaves: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAllLeaveRequests() {
        return this.prisma.leaveRequest.findMany({
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getEmployeeLeaveRequests(employeeId) {
        return this.prisma.leaveRequest.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async approveLeaveRequest(id, adminNotes) {
        const leaveReq = await this.prisma.leaveRequest.findUnique({
            where: { id },
            include: { employee: true }
        });
        if (!leaveReq)
            throw new common_1.BadRequestException('طلب الإجازة غير موجود');
        if (leaveReq.status !== 'PENDING')
            throw new common_1.BadRequestException('تم مراجعة هذا الطلب مسبقاً');
        const start = new Date(leaveReq.startDate);
        const end = new Date(leaveReq.endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const usedLeaves = await this.prisma.leaveRequest.count({
            where: { employeeId: leaveReq.employeeId, status: 'APPROVED' }
        });
        const allowedLeaves = leaveReq.employee.allowedLeaves || 21;
        const approvedLeaves = await this.prisma.leaveRequest.findMany({
            where: { employeeId: leaveReq.employeeId, status: 'APPROVED' }
        });
        const totalUsedDays = approvedLeaves.reduce((sum, l) => {
            const s = new Date(l.startDate);
            const e = new Date(l.endDate);
            return sum + Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }, 0);
        if (totalUsedDays + daysDiff > allowedLeaves) {
            throw new common_1.BadRequestException(`رصيد الإجازات غير كافٍ. المتبقي: ${allowedLeaves - totalUsedDays} يوم، المطلوب: ${daysDiff} يوم`);
        }
        const req = await this.prisma.leaveRequest.update({
            where: { id },
            data: { status: 'APPROVED', reviewedAt: new Date(), adminNotes },
            include: { employee: true }
        });
        await this.prisma.calendarEvent.create({
            data: { title: `إجازة: ${req.employee.name}`, date: req.startDate, type: 'إجازة', description: `${req.startDate} إلى ${req.endDate} (${daysDiff} يوم) — ${req.reason}` }
        });
        await this.createNotification(req.employeeId, `تمت الموافقة على طلب إجازتك من ${req.startDate} إلى ${req.endDate} (${daysDiff} يوم)`, 'إجازة مقبولة ✅');
        await this.logActivity('الموافقة على إجازة', `تمت الموافقة على إجازة ${req.employee.name} — ${daysDiff} يوم`);
        return req;
    }
    async rejectLeaveRequest(id, adminNotes) {
        const leaveReq = await this.prisma.leaveRequest.findUnique({ where: { id } });
        if (!leaveReq)
            throw new common_1.BadRequestException('طلب الإجازة غير موجود');
        if (leaveReq.status !== 'PENDING')
            throw new common_1.BadRequestException('تم مراجعة هذا الطلب مسبقاً');
        const req = await this.prisma.leaveRequest.update({
            where: { id },
            data: { status: 'REJECTED', reviewedAt: new Date(), adminNotes },
            include: { employee: true }
        });
        await this.createNotification(req.employeeId, `تم رفض طلب إجازتك. ${adminNotes || ''}`, 'إجازة مرفوضة ❌');
        await this.logActivity('رفض إجازة', `تم رفض إجازة ${req.employee.name}`);
        return req;
    }
    async getLeaveStats() {
        const total = await this.prisma.leaveRequest.count();
        const pending = await this.prisma.leaveRequest.count({ where: { status: 'PENDING' } });
        const approved = await this.prisma.leaveRequest.count({ where: { status: 'APPROVED' } });
        const rejected = await this.prisma.leaveRequest.count({ where: { status: 'REJECTED' } });
        const currentlyOnLeave = await this.prisma.leaveRequest.findMany({
            where: { status: 'APPROVED' },
            include: { employee: { select: { id: true, name: true, fullName: true, photo1: true } } }
        });
        const today = new Date().toISOString().split('T')[0];
        const onLeaveNow = currentlyOnLeave.filter(l => l.startDate <= today && l.endDate >= today);
        return { total, pending, approved, rejected, onLeaveNow };
    }
    async getLeaderboard() {
        const employees = await this.prisma.employee.findMany({
            where: { role: 'employee' },
            include: {
                _count: { select: { reports: true, warnings: true, rewards: true, attendance: true } },
                performanceReviews: { orderBy: { month: 'desc' }, take: 3 },
                salaryRecords: { orderBy: { paidAt: 'desc' }, take: 1 },
            }
        });
        const month = new Date().toISOString().substring(0, 7);
        const targets = await this.prisma.monthlyTarget.findMany({ where: { month } });
        return employees.map(emp => {
            const target = targets.find(t => t.employeeId === emp.id);
            const avgRating = emp.performanceReviews.length > 0
                ? emp.performanceReviews.reduce((sum, r) => sum + r.rating, 0) / emp.performanceReviews.length
                : 0;
            const score = (emp._count.reports * 2) + (emp._count.rewards * 5) - (emp._count.warnings * 10) + (avgRating * 3) + (emp._count.attendance * 1);
            return {
                id: emp.id, name: emp.name, fullName: emp.fullName, photo1: emp.photo1, platform: emp.platform,
                reports: emp._count.reports, warnings: emp._count.warnings, rewards: emp._count.rewards,
                attendance: emp._count.attendance, avgRating: Math.round(avgRating * 10) / 10,
                targetProgress: target ? { target: target.targetCount, achieved: target.achievedCount } : null,
                score
            };
        }).sort((a, b) => b.score - a.score);
    }
    async getSalaryChangeLogs(employeeId) {
        return this.prisma.salaryChangeLog.findMany({
            where: { employeeId },
            orderBy: { changedAt: 'desc' }
        });
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.prisma.employee.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('المستخدم غير موجود');
        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid)
            throw new common_1.BadRequestException('كلمة المرور الحالية غير صحيحة');
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.employee.update({ where: { id: userId }, data: { password: hashed } });
        await this.logActivity('تغيير كلمة مرور', `قام الموظف ${user.name} بتغيير كلمة مروره`);
        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }
    async submitSelfAssessment(employeeId, month, rating, notes) {
        return this.prisma.performanceReview.upsert({
            where: { employeeId_month: { employeeId, month: 'self-' + month } },
            update: { rating, notes },
            create: { employeeId, month: 'self-' + month, rating, notes }
        });
    }
    async getSelfAssessment(employeeId, month) {
        return this.prisma.performanceReview.findUnique({
            where: { employeeId_month: { employeeId, month: 'self-' + month } }
        });
    }
    async generateWeeklyReport() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        const totalReports = await this.prisma.report.count({ where: { dateString: { gte: weekAgoStr } } });
        const totalAttendance = await this.prisma.attendanceRecord.count({ where: { date: { gte: weekAgoStr } } });
        const totalWarnings = await this.prisma.warningRequest.count({ where: { createdAt: { gte: weekAgo } } });
        const totalRewards = await this.prisma.reward.count({ where: { issuedAt: { gte: weekAgo } } });
        const totalLeaveRequests = await this.prisma.leaveRequest.count({ where: { createdAt: { gte: weekAgo } } });
        const totalEmployees = await this.prisma.employee.count({ where: { role: 'employee' } });
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            const reports = await this.prisma.report.count({ where: { dateString: dateStr } });
            const attendance = await this.prisma.attendanceRecord.count({ where: { date: dateStr, status: 'PRESENT' } });
            days.push({ date: dateStr, dayName: d.toLocaleDateString('ar-EG', { weekday: 'long' }), reports, attendance });
        }
        return { period: `${weekAgoStr} — ${now.toISOString().split('T')[0]}`, totalReports, totalAttendance, totalWarnings, totalRewards, totalLeaveRequests, totalEmployees, days };
    }
    async getAchievements(employeeId) {
        const emp = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { _count: { select: { reports: true, rewards: true, attendance: true, warnings: true } } }
        });
        if (!emp)
            return [];
        const achievements = [];
        achievements.push({ icon: '📊', title: 'أول تقرير', description: 'أرسل تقريرك الأول', unlocked: emp._count.reports >= 1 });
        achievements.push({ icon: '📈', title: 'منتج', description: 'أرسل 10 تقارير', unlocked: emp._count.reports >= 10 });
        achievements.push({ icon: '🚀', title: 'نجم التقارير', description: 'أرسل 50 تقرير', unlocked: emp._count.reports >= 50 });
        achievements.push({ icon: '💎', title: 'أسطورة التقارير', description: 'أرسل 100 تقرير', unlocked: emp._count.reports >= 100 });
        achievements.push({ icon: '✅', title: 'ملتزم', description: '10 أيام حضور', unlocked: emp._count.attendance >= 10 });
        achievements.push({ icon: '🏅', title: 'منضبط', description: '30 يوم حضور', unlocked: emp._count.attendance >= 30 });
        achievements.push({ icon: '🎖️', title: 'بطل الالتزام', description: '60 يوم حضور', unlocked: emp._count.attendance >= 60 });
        achievements.push({ icon: '⭐', title: 'أول مكافأة', description: 'احصل على مكافأة', unlocked: emp._count.rewards >= 1 });
        achievements.push({ icon: '🌟', title: 'نجم المكافآت', description: 'احصل على 5 مكافآت', unlocked: emp._count.rewards >= 5 });
        achievements.push({ icon: '🛡️', title: 'سجل نظيف', description: 'بدون تحذيرات', unlocked: emp._count.warnings === 0 });
        return achievements;
    }
    async getMonthlyComparison() {
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7);
        const currentReports = await this.prisma.report.count({ where: { dateString: { startsWith: currentMonth } } });
        const lastReports = await this.prisma.report.count({ where: { dateString: { startsWith: lastMonth } } });
        const currentWarnings = await this.prisma.warningRequest.count({ where: { createdAt: { gte: new Date(currentMonth + '-01') } } });
        const lastWarnings = await this.prisma.warningRequest.count({ where: { createdAt: { gte: new Date(lastMonth + '-01'), lt: new Date(currentMonth + '-01') } } });
        const currentAttendance = await this.prisma.attendanceRecord.count({ where: { date: { startsWith: currentMonth } } });
        const lastAttendance = await this.prisma.attendanceRecord.count({ where: { date: { startsWith: lastMonth } } });
        const calcChange = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
        return {
            currentMonth, lastMonth,
            reports: { current: currentReports, last: lastReports, change: calcChange(currentReports, lastReports) },
            warnings: { current: currentWarnings, last: lastWarnings, change: calcChange(currentWarnings, lastWarnings) },
            attendance: { current: currentAttendance, last: lastAttendance, change: calcChange(currentAttendance, lastAttendance) },
        };
    }
    async createFinanceRequest(employeeId, amount, notes) {
        const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
        if (!emp)
            throw new Error('Employee not found');
        if (amount > emp.currentBalance) {
            throw new Error('الرصيد غير كافي لطلب هذا المبلغ');
        }
        return this.prisma.financialRequest.create({
            data: { employeeId, amount, notes }
        });
    }
    async getAllFinanceRequests() {
        return this.prisma.financialRequest.findMany({
            include: {
                employee: { select: { id: true, fullName: true, platform: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getEmployeeFinanceRequests(empId) {
        return this.prisma.financialRequest.findMany({
            where: { employeeId: empId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async approveFinanceRequest(id, adminNotes) {
        const req = await this.prisma.financialRequest.findUnique({ where: { id } });
        if (!req || req.status !== 'PENDING')
            throw new Error('Invalid request or already processed');
        await this.prisma.$transaction([
            this.prisma.financialRequest.update({
                where: { id },
                data: { status: 'APPROVED', adminNotes }
            }),
            this.prisma.employee.update({
                where: { id: req.employeeId },
                data: { currentBalance: { decrement: req.amount } }
            }),
            this.prisma.salaryRecord.create({
                data: { employeeId: req.employeeId, amount: req.amount, notes: 'سحب مالي معتمد: ' + (adminNotes || '') }
            })
        ]);
        return { success: true };
    }
    async rejectFinanceRequest(id, adminNotes) {
        return this.prisma.financialRequest.update({
            where: { id },
            data: { status: 'REJECTED', adminNotes }
        });
    }
    async updateBalance(employeeId, amount, notes) {
        return this.prisma.employee.update({
            where: { id: employeeId },
            data: { currentBalance: amount }
        });
    }
    async getDailyOperations() {
        const today = new Date().toISOString().split('T')[0];
        const month = new Date().toISOString().substring(0, 7);
        const employees = await this.prisma.employee.findMany({
            include: {
                attendance: {
                    where: { date: today }
                },
                monthlyTargets: {
                    where: { month }
                },
                reports: {
                    where: { dateString: today, status: 'APPROVED' }
                }
            }
        });
        return employees.map(emp => {
            const todayAtt = emp.attendance.length > 0 ? emp.attendance[0] : null;
            const target = emp.monthlyTargets.length > 0 ? emp.monthlyTargets[0] : null;
            return {
                id: emp.id,
                fullName: emp.fullName || emp.name || 'بدون اسم',
                platform: emp.platform || 'غير محدد',
                attendanceStatus: todayAtt ? todayAtt.status : 'NOT_SUBMITTED',
                videoCountToday: emp.reports.length,
                todayLinks: emp.reports.map(r => r.tiktokUrl),
                originalTarget: target ? target.targetCount : (emp.monthlyVideoTarget || 0),
                achievedTarget: target ? target.achievedCount : 0,
            };
        });
    }
    async blockEmployee(id, reason) {
        const emp = await this.prisma.employee.findUnique({ where: { id } });
        if (!emp)
            throw new common_1.BadRequestException('الموظف غير موجود');
        if (emp.isBlocked)
            throw new common_1.BadRequestException('الموظف محظور بالفعل');
        await this.prisma.employee.update({
            where: { id },
            data: { isBlocked: true, blockedReason: reason || 'حظر من قبل المدير', blockedAt: new Date() }
        });
        await this.prisma.activityLog.create({
            data: { action: '🚫 حظر موظف', details: `تم حظر ${emp.fullName || emp.name} — السبب: ${reason || 'غير محدد'}` }
        });
        return { success: true, message: `تم حظر ${emp.fullName || emp.name} بنجاح` };
    }
    async unblockEmployee(id) {
        const emp = await this.prisma.employee.findUnique({ where: { id } });
        if (!emp)
            throw new common_1.BadRequestException('الموظف غير موجود');
        if (!emp.isBlocked)
            throw new common_1.BadRequestException('الموظف غير محظور');
        await this.prisma.employee.update({
            where: { id },
            data: { isBlocked: false, blockedReason: null, blockedAt: null }
        });
        await this.prisma.activityLog.create({
            data: { action: '✅ رفع الحظر', details: `تم رفع الحظر عن ${emp.fullName || emp.name}` }
        });
        return { success: true, message: `تم رفع الحظر عن ${emp.fullName || emp.name}` };
    }
    async permanentBan(id) {
        const emp = await this.prisma.employee.findUnique({ where: { id } });
        if (!emp)
            throw new common_1.BadRequestException('الموظف غير موجود');
        const empName = emp.fullName || emp.name;
        await this.prisma.chatMessage.deleteMany({ where: { employeeId: id } });
        await this.prisma.notification.deleteMany({ where: { employeeId: id } });
        await this.prisma.warningRequest.deleteMany({ where: { employeeId: id } });
        await this.prisma.warning.deleteMany({ where: { employeeId: id } });
        await this.prisma.reward.deleteMany({ where: { employeeId: id } });
        await this.prisma.note.deleteMany({ where: { employeeId: id } });
        await this.prisma.report.deleteMany({ where: { employeeId: id } });
        await this.prisma.attendanceRecord.deleteMany({ where: { employeeId: id } });
        await this.prisma.accountLink.deleteMany({ where: { employeeId: id } });
        await this.prisma.salaryRecord.deleteMany({ where: { employeeId: id } });
        await this.prisma.salaryChangeLog.deleteMany({ where: { employeeId: id } });
        await this.prisma.performanceReview.deleteMany({ where: { employeeId: id } });
        await this.prisma.contract.deleteMany({ where: { employeeId: id } });
        await this.prisma.monthlyTarget.deleteMany({ where: { employeeId: id } });
        await this.prisma.leaveRequest.deleteMany({ where: { employeeId: id } });
        await this.prisma.financialRequest.deleteMany({ where: { employeeId: id } });
        await this.prisma.employee.delete({ where: { id } });
        await this.prisma.activityLog.create({
            data: { action: '⛔ حظر دائم وحذف', details: `تم حذف جميع بيانات ${empName} نهائياً من النظام` }
        });
        return { success: true, message: `تم حذف ${empName} وجميع بياناته نهائياً` };
    }
    async getBlockedEmployees() {
        return this.prisma.employee.findMany({
            where: { isBlocked: true },
            select: { id: true, name: true, fullName: true, username: true, photo1: true, platform: true, blockedReason: true, blockedAt: true }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, firebase_service_1.FirebaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map