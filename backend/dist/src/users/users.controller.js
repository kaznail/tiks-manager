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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const supabase_storage_service_1 = require("./supabase-storage.service");
const localDiskStorage = (0, multer_1.diskStorage)({
    destination: './uploads',
    filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
    }
});
const memStorage = (0, multer_1.memoryStorage)();
let UsersController = class UsersController {
    constructor(usersService, storageService) {
        this.usersService = usersService;
        this.storageService = storageService;
    }
    async uploadFileToCloud(file, folder = 'photos') {
        if (this.storageService.isConfigured() && file.buffer) {
            const url = await this.storageService.uploadFile(file, folder);
            if (url)
                return url;
        }
        return file.filename ? `/uploads/${file.filename}` : null;
    }
    createFinanceRequest(body) {
        return this.usersService.createFinanceRequest(body.employeeId, body.amount, body.notes);
    }
    getAllFinanceRequests() {
        return this.usersService.getAllFinanceRequests();
    }
    getEmployeeFinanceRequests(empId) {
        return this.usersService.getEmployeeFinanceRequests(empId);
    }
    approveFinanceRequest(id, body) {
        return this.usersService.approveFinanceRequest(id, body.adminNotes);
    }
    rejectFinanceRequest(id, body) {
        return this.usersService.rejectFinanceRequest(id, body.adminNotes);
    }
    updateBalance(id, body) {
        return this.usersService.updateBalance(id, body.amount, body.notes);
    }
    changePassword(body) {
        return this.usersService.changePassword(body.userId, body.oldPassword, body.newPassword);
    }
    submitSelfAssessment(body) {
        return this.usersService.submitSelfAssessment(body.employeeId, body.month, body.rating, body.notes);
    }
    getSelfAssessment(empId, month) {
        return this.usersService.getSelfAssessment(empId, month);
    }
    getWeeklyReport() { return this.usersService.generateWeeklyReport(); }
    getAchievements(empId) { return this.usersService.getAchievements(empId); }
    getMonthlyComparison() { return this.usersService.getMonthlyComparison(); }
    getStats() { return this.usersService.getStats(); }
    getAdminNotifications() { return this.usersService.getAdminNotifications(); }
    getActivityLogs() { return this.usersService.getActivityLogs(); }
    sendNotification(body) {
        return this.usersService.createNotification(body.employeeId, body.message, body.title);
    }
    async broadcastNotification(body) {
        const employees = await this.usersService.findAll();
        const results = [];
        for (const emp of employees) {
            if (emp.isBlocked)
                continue;
            const notif = await this.usersService.createNotification(emp.id, body.message, body.title);
            results.push(notif);
        }
        return results;
    }
    deleteNotification(notifId) {
        return this.usersService.deleteNotification(notifId);
    }
    getPendingWarnings() { return this.usersService.getPendingWarningRequests(); }
    getAllWarnings() { return this.usersService.getAllWarningRequests(); }
    createWarningRequest(body) {
        return this.usersService.createWarningRequest(body.employeeId, body.type, body.reason);
    }
    approveWarning(reqId) {
        return this.usersService.approveWarningRequest(reqId);
    }
    rejectWarning(reqId) {
        return this.usersService.rejectWarningRequest(reqId);
    }
    removeWarning(warningId) {
        return this.usersService.removeWarning(warningId);
    }
    getDailyOperations() { return this.usersService.getDailyOperations(); }
    getAttendanceToday() { return this.usersService.getAllAttendanceToday(); }
    recordAttendance(body) {
        return this.usersService.recordAttendance(body.employeeId, body.videoLinks, body.notes);
    }
    async sendChatMessage(body) {
        let content = body.content;
        if (content.startsWith('audio:data:audio')) {
            const audioUrl = await this.storageService.uploadAudio(content);
            if (audioUrl) {
                content = `audio:${audioUrl}`;
            }
        }
        return this.usersService.sendChatMessage(body.employeeId, content, body.isFromAdmin);
    }
    getChatMessages(empId) {
        return this.usersService.getChatMessages(empId);
    }
    getEmployeeChatMessages(empId) {
        return this.usersService.getEmployeeChatMessages(empId);
    }
    getEvents() { return this.usersService.getEvents(); }
    createEvent(body) {
        return this.usersService.createEvent(body.title, body.date, body.type, body.description);
    }
    deleteEvent(eventId) {
        return this.usersService.deleteEvent(eventId);
    }
    getSettings() { return this.usersService.getAllSettings(); }
    setSetting(body) {
        return this.usersService.setSetting(body.key, body.value);
    }
    setMonthlyTarget(body) {
        return this.usersService.setMonthlyTarget(body.employeeId, body.month, body.targetCount);
    }
    getAllTargets(month) {
        return this.usersService.getAllMonthlyTargets(month);
    }
    getTarget(empId, month) {
        return this.usersService.getMonthlyTarget(empId, month);
    }
    getPendingLeaves() { return this.usersService.getPendingLeaveRequests(); }
    getAllLeaves() { return this.usersService.getAllLeaveRequests(); }
    getLeaveStats() { return this.usersService.getLeaveStats(); }
    getEmployeeLeaves(empId) {
        return this.usersService.getEmployeeLeaveRequests(empId);
    }
    createLeaveRequest(body) {
        return this.usersService.createLeaveRequest(body.employeeId, body);
    }
    approveLeave(leaveId, body) {
        return this.usersService.approveLeaveRequest(leaveId, body.adminNotes);
    }
    rejectLeave(leaveId, body) {
        return this.usersService.rejectLeaveRequest(leaveId, body.adminNotes);
    }
    getLeaderboard() { return this.usersService.getLeaderboard(); }
    findAll() { return this.usersService.findAll(); }
    async createEmployee(body, files) {
        if (files?.photo1)
            body.photo1 = await this.uploadFileToCloud(files.photo1[0], 'photos');
        if (files?.photo2)
            body.photo2 = await this.uploadFileToCloud(files.photo2[0], 'photos');
        if (files?.photo3)
            body.photo3 = await this.uploadFileToCloud(files.photo3[0], 'photos');
        if (body.accountLinks && typeof body.accountLinks === 'string') {
            try {
                body.accountLinks = JSON.parse(body.accountLinks);
            }
            catch (e) { }
        }
        return this.usersService.createEmployee(body);
    }
    async updateEmployee(id, body, files) {
        if (files?.photo1)
            body.photo1 = await this.uploadFileToCloud(files.photo1[0], 'photos');
        if (files?.photo2)
            body.photo2 = await this.uploadFileToCloud(files.photo2[0], 'photos');
        if (files?.photo3)
            body.photo3 = await this.uploadFileToCloud(files.photo3[0], 'photos');
        return this.usersService.updateEmployee(id, body);
    }
    deleteEmployee(id) {
        return this.usersService.deleteEmployee(id);
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    getEmployeeAttendance(id) {
        return this.usersService.getEmployeeAttendance(id);
    }
    getEmployeeNotifications(id) {
        return this.usersService.getEmployeeNotifications(id);
    }
    markNotifRead(notifId) {
        return this.usersService.markNotificationRead(notifId);
    }
    addSalaryRecord(id, body) {
        return this.usersService.addSalaryRecord(id, body);
    }
    addAccountLink(id, body) {
        return this.usersService.addAccountLink(id, body);
    }
    addWarning(id, body) {
        return this.usersService.addWarning(id, body);
    }
    addReward(id, body) {
        return this.usersService.addReward(id, body);
    }
    addNote(id, body) {
        return this.usersService.addNote(id, body);
    }
    saveFcmToken(id, token) {
        return this.usersService.saveFcmToken(id, token);
    }
    addPerformanceReview(id, body) {
        return this.usersService.addPerformanceReview(id, body.month, body.rating, body.notes);
    }
    async addContract(id, title, file) {
        let filePath = '';
        if (file) {
            filePath = await this.uploadFileToCloud(file, 'contracts') || '';
        }
        return this.usersService.addContract(id, title, filePath);
    }
    async uploadAudio(file) {
        if (!file)
            return { url: null };
        const url = await this.uploadFileToCloud(file, 'audio');
        return { url };
    }
    async getBlockedEmployees() {
        return this.usersService.getBlockedEmployees();
    }
    async blockEmployee(id, body) {
        return this.usersService.blockEmployee(id, body.reason);
    }
    async unblockEmployee(id) {
        return this.usersService.unblockEmployee(id);
    }
    async permanentBan(id) {
        return this.usersService.permanentBan(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('finance/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createFinanceRequest", null);
__decorate([
    (0, common_1.Get)('finance/requests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAllFinanceRequests", null);
__decorate([
    (0, common_1.Get)('finance/employee/:empId'),
    __param(0, (0, common_1.Param)('empId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getEmployeeFinanceRequests", null);
__decorate([
    (0, common_1.Post)('finance/approve/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approveFinanceRequest", null);
__decorate([
    (0, common_1.Post)('finance/reject/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "rejectFinanceRequest", null);
__decorate([
    (0, common_1.Post)(':id/balance'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateBalance", null);
__decorate([
    (0, common_1.Post)('password/change'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('self-assessment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "submitSelfAssessment", null);
__decorate([
    (0, common_1.Get)('self-assessment/:empId/:month'),
    __param(0, (0, common_1.Param)('empId')),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getSelfAssessment", null);
__decorate([
    (0, common_1.Get)('weekly-report'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getWeeklyReport", null);
__decorate([
    (0, common_1.Get)('achievements/:empId'),
    __param(0, (0, common_1.Param)('empId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAchievements", null);
__decorate([
    (0, common_1.Get)('monthly-comparison'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMonthlyComparison", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('logs/notifications'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAdminNotifications", null);
__decorate([
    (0, common_1.Get)('logs/activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getActivityLogs", null);
__decorate([
    (0, common_1.Post)('notifications/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('notifications/broadcast'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "broadcastNotification", null);
__decorate([
    (0, common_1.Delete)('notifications/:notifId'),
    __param(0, (0, common_1.Param)('notifId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Get)('warnings/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getPendingWarnings", null);
__decorate([
    (0, common_1.Get)('warnings/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAllWarnings", null);
__decorate([
    (0, common_1.Post)('warnings/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createWarningRequest", null);
__decorate([
    (0, common_1.Post)('warnings/:reqId/approve'),
    __param(0, (0, common_1.Param)('reqId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approveWarning", null);
__decorate([
    (0, common_1.Post)('warnings/:reqId/reject'),
    __param(0, (0, common_1.Param)('reqId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "rejectWarning", null);
__decorate([
    (0, common_1.Delete)('warnings/issued/:warningId'),
    __param(0, (0, common_1.Param)('warningId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "removeWarning", null);
__decorate([
    (0, common_1.Get)('admin/operations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getDailyOperations", null);
__decorate([
    (0, common_1.Get)('attendance/today'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAttendanceToday", null);
__decorate([
    (0, common_1.Post)('attendance/checkin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "recordAttendance", null);
__decorate([
    (0, common_1.Post)('chat/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sendChatMessage", null);
__decorate([
    (0, common_1.Get)('chat/employee/:empId'),
    __param(0, (0, common_1.Param)('empId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getChatMessages", null);
__decorate([
    (0, common_1.Get)('chat/my-messages/:empId'),
    __param(0, (0, common_1.Param)('empId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getEmployeeChatMessages", null);
__decorate([
    (0, common_1.Get)('events/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('events/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Delete)('events/:eventId'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.Get)('settings/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings/set'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setSetting", null);
__decorate([
    (0, common_1.Post)('targets/set'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setMonthlyTarget", null);
__decorate([
    (0, common_1.Get)('targets/all/:month'),
    __param(0, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAllTargets", null);
__decorate([
    (0, common_1.Get)('targets/:empId/:month'),
    __param(0, (0, common_1.Param)('empId')),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getTarget", null);
__decorate([
    (0, common_1.Get)('leaves/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getPendingLeaves", null);
__decorate([
    (0, common_1.Get)('leaves/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAllLeaves", null);
__decorate([
    (0, common_1.Get)('leaves/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getLeaveStats", null);
__decorate([
    (0, common_1.Get)('leaves/employee/:empId'),
    __param(0, (0, common_1.Param)('empId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getEmployeeLeaves", null);
__decorate([
    (0, common_1.Post)('leaves/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createLeaveRequest", null);
__decorate([
    (0, common_1.Post)('leaves/:leaveId/approve'),
    __param(0, (0, common_1.Param)('leaveId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approveLeave", null);
__decorate([
    (0, common_1.Post)('leaves/:leaveId/reject'),
    __param(0, (0, common_1.Param)('leaveId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "rejectLeave", null);
__decorate([
    (0, common_1.Get)('leaderboard/ranking'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'photo1', maxCount: 1 },
        { name: 'photo2', maxCount: 1 },
        { name: 'photo3', maxCount: 1 },
    ], { storage: memStorage })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createEmployee", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'photo1', maxCount: 1 },
        { name: 'photo2', maxCount: 1 },
        { name: 'photo3', maxCount: 1 },
    ], { storage: memStorage })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateEmployee", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteEmployee", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/attendance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getEmployeeAttendance", null);
__decorate([
    (0, common_1.Get)(':id/notifications'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getEmployeeNotifications", null);
__decorate([
    (0, common_1.Post)(':id/notifications/read/:notifId'),
    __param(0, (0, common_1.Param)('notifId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "markNotifRead", null);
__decorate([
    (0, common_1.Post)(':id/salary'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addSalaryRecord", null);
__decorate([
    (0, common_1.Post)(':id/link'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addAccountLink", null);
__decorate([
    (0, common_1.Post)(':id/warnings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addWarning", null);
__decorate([
    (0, common_1.Post)(':id/rewards'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addReward", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addNote", null);
__decorate([
    (0, common_1.Post)(':id/fcm-token'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "saveFcmToken", null);
__decorate([
    (0, common_1.Post)(':id/performance'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addPerformanceReview", null);
__decorate([
    (0, common_1.Post)(':id/contracts'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: memStorage })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addContract", null);
__decorate([
    (0, common_1.Post)('chat/upload-audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', { storage: memStorage })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAudio", null);
__decorate([
    (0, common_1.Get)('blocked'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBlockedEmployees", null);
__decorate([
    (0, common_1.Post)(':id/block'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "blockEmployee", null);
__decorate([
    (0, common_1.Post)(':id/unblock'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unblockEmployee", null);
__decorate([
    (0, common_1.Delete)(':id/permanent-ban'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "permanentBan", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        supabase_storage_service_1.SupabaseStorageService])
], UsersController);
//# sourceMappingURL=users.controller.js.map