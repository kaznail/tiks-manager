import { Controller, Get, Param, Post, Put, Body, Delete, UseGuards, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { SupabaseStorageService } from './supabase-storage.service';

// Local fallback storage (when Supabase is not configured)
const localDiskStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
    return cb(null, `${randomName}${extname(file.originalname)}`);
  }
});

// Memory storage for Supabase uploads (file stays in memory buffer)
const memStorage = memoryStorage();


@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  // Helper: upload a file to Supabase or fallback to local
  private async uploadFileToCloud(file: any, folder: string = 'photos'): Promise<string> {
    if (this.storageService.isConfigured() && file.buffer) {
      const url = await this.storageService.uploadFile(file, folder);
      if (url) return url;
    }
    // Fallback: local path
    return file.filename ? `/uploads/${file.filename}` : null;
  }

  // ===== FINANCE & VIRTUAL WALLET =====

  @Post('finance/request')
  createFinanceRequest(@Body() body: { employeeId: string; amount: number; notes?: string }) {
    return this.usersService.createFinanceRequest(body.employeeId, body.amount, body.notes);
  }

  @Get('finance/requests')
  getAllFinanceRequests() {
    return this.usersService.getAllFinanceRequests();
  }

  @Get('finance/employee/:empId')
  getEmployeeFinanceRequests(@Param('empId') empId: string) {
    return this.usersService.getEmployeeFinanceRequests(empId);
  }

  @Post('finance/approve/:id')
  approveFinanceRequest(@Param('id') id: string, @Body() body: { adminNotes?: string }) {
    return this.usersService.approveFinanceRequest(id, body.adminNotes);
  }

  @Post('finance/reject/:id')
  rejectFinanceRequest(@Param('id') id: string, @Body() body: { adminNotes?: string }) {
    return this.usersService.rejectFinanceRequest(id, body.adminNotes);
  }

  @Post(':id/balance')
  updateBalance(@Param('id') id: string, @Body() body: { amount: number; notes?: string }) {
    return this.usersService.updateBalance(id, body.amount, body.notes);
  }

  // ===== PASSWORD & SELF-ASSESSMENT =====

  @Post('password/change')
  changePassword(@Body() body: { userId: string; oldPassword: string; newPassword: string }) {
    return this.usersService.changePassword(body.userId, body.oldPassword, body.newPassword);
  }

  @Post('self-assessment')
  submitSelfAssessment(@Body() body: { employeeId: string; month: string; rating: number; notes?: string }) {
    return this.usersService.submitSelfAssessment(body.employeeId, body.month, body.rating, body.notes);
  }

  @Get('self-assessment/:empId/:month')
  getSelfAssessment(@Param('empId') empId: string, @Param('month') month: string) {
    return this.usersService.getSelfAssessment(empId, month);
  }

  @Get('weekly-report')
  getWeeklyReport() { return this.usersService.generateWeeklyReport(); }

  @Get('achievements/:empId')
  getAchievements(@Param('empId') empId: string) { return this.usersService.getAchievements(empId); }

  @Get('monthly-comparison')
  getMonthlyComparison() { return this.usersService.getMonthlyComparison(); }

  // ===== STATIC ROUTES FIRST =====

  @Get('stats/overview')
  getStats() { return this.usersService.getStats(); }

  @Get('logs/notifications')
  getAdminNotifications() { return this.usersService.getAdminNotifications(); }

  @Get('logs/activity')
  getActivityLogs() { return this.usersService.getActivityLogs(); }

  @Post('notifications/send')
  sendNotification(@Body() body: { employeeId: string; title: string; message: string }) {
    return this.usersService.createNotification(body.employeeId, body.message, body.title);
  }

  @Post('notifications/broadcast')
  async broadcastNotification(@Body() body: { title: string; message: string }) {
    const employees = await this.usersService.findAll();
    const results = [];
    for (const emp of employees) {
      // Skip blocked employees
      if ((emp as any).isBlocked) continue;
      const notif = await this.usersService.createNotification(emp.id, body.message, body.title);
      results.push(notif);
    }
    return results;
  }

  @Delete('notifications/:notifId')
  deleteNotification(@Param('notifId') notifId: string) {
    return this.usersService.deleteNotification(notifId);
  }

  // ===== WARNING REQUESTS =====

  @Get('warnings/pending')
  getPendingWarningRequests() {
    return this.usersService.getPendingWarningRequests();
  }

  @Get('warnings/all')
  getAllWarningRequests() {
    return this.usersService.getAllWarningRequests();
  }

  @Get('warnings/issued')
  getIssuedWarnings() {
    return this.usersService.getIssuedWarnings();
  }

  @Post('warnings/request')
  createWarningRequest(@Body() body: { employeeId: string; type: string; reason: string }) {
    return this.usersService.createWarningRequest(body.employeeId, body.type, body.reason);
  }

  @Post('warnings/:reqId/approve')
  approveWarning(@Param('reqId') reqId: string) {
    return this.usersService.approveWarningRequest(reqId);
  }

  @Post('warnings/:reqId/reject')
  rejectWarning(@Param('reqId') reqId: string) {
    return this.usersService.rejectWarningRequest(reqId);
  }

  @Delete('warnings/issued/:warningId')
  removeWarning(@Param('warningId') warningId: string) {
    return this.usersService.removeWarning(warningId);
  }

  // ===== ATTENDANCE =====

  @Get('admin/operations')
  getDailyOperations() { return this.usersService.getDailyOperations(); }

  @Get('attendance/today')
  getAttendanceToday() { return this.usersService.getAllAttendanceToday(); }

  @Post('attendance/checkin')
  recordAttendance(@Body() body: { employeeId: string; videoLinks: string[]; notes?: string }) {
    return this.usersService.recordAttendance(body.employeeId, body.videoLinks, body.notes);
  }

  // ===== CHAT =====

  @Post('chat/send')
  async sendChatMessage(@Body() body: { employeeId: string; content: string; isFromAdmin: boolean }) {
    let content = body.content;
    
    // Auto-detect base64 audio and upload to Supabase Storage
    if (content.startsWith('audio:data:audio')) {
      const audioUrl = await this.storageService.uploadAudio(content);
      if (audioUrl) {
        content = `audio:${audioUrl}`;
      }
      // If upload fails, the base64 will still be stored as fallback
    }
    
    return this.usersService.sendChatMessage(body.employeeId, content, body.isFromAdmin);
  }

  @Get('chat/employee/:empId')
  getChatMessages(@Param('empId') empId: string) {
    return this.usersService.getChatMessages(empId);
  }

  @Get('chat/my-messages/:empId')
  getEmployeeChatMessages(@Param('empId') empId: string) {
    return this.usersService.getEmployeeChatMessages(empId);
  }

  // ===== CALENDAR EVENTS =====

  @Get('events/all')
  getEvents() { return this.usersService.getEvents(); }

  @Post('events/create')
  createEvent(@Body() body: { title: string; date: string; type?: string; description?: string }) {
    return this.usersService.createEvent(body.title, body.date, body.type, body.description);
  }

  @Delete('events/:eventId')
  deleteEvent(@Param('eventId') eventId: string) {
    return this.usersService.deleteEvent(eventId);
  }

  // ===== SYSTEM SETTINGS =====

  @Get('settings/all')
  getSettings() { return this.usersService.getAllSettings(); }

  @Post('settings/set')
  setSetting(@Body() body: { key: string; value: string }) {
    return this.usersService.setSetting(body.key, body.value);
  }

  // ===== MONTHLY TARGETS =====

  @Post('targets/set')
  setMonthlyTarget(@Body() body: { employeeId: string; month: string; targetCount: number }) {
    return this.usersService.setMonthlyTarget(body.employeeId, body.month, body.targetCount);
  }

  @Get('targets/all/:month')
  getAllTargets(@Param('month') month: string) {
    return this.usersService.getAllMonthlyTargets(month);
  }

  @Get('targets/:empId/:month')
  getTarget(@Param('empId') empId: string, @Param('month') month: string) {
    return this.usersService.getMonthlyTarget(empId, month);
  }

  @Put('bulk-target')
  setBulkTarget(@Body() body: { target: number }) {
    return this.usersService.setBulkTarget(body.target);
  }

  // ===== LEAVE REQUESTS =====

  @Get('leaves/pending')
  getPendingLeaves() { return this.usersService.getPendingLeaveRequests(); }

  @Get('leaves/all')
  getAllLeaves() { return this.usersService.getAllLeaveRequests(); }

  @Get('leaves/stats')
  getLeaveStats() { return this.usersService.getLeaveStats(); }

  @Get('leaves/employee/:empId')
  getEmployeeLeaves(@Param('empId') empId: string) {
    return this.usersService.getEmployeeLeaveRequests(empId);
  }

  @Post('leaves/request')
  createLeaveRequest(@Body() body: { employeeId: string; startDate: string; endDate: string; reason: string; type?: string }) {
    return this.usersService.createLeaveRequest(body.employeeId, body);
  }

  @Post('leaves/:leaveId/approve')
  approveLeave(@Param('leaveId') leaveId: string, @Body() body: { adminNotes?: string }) {
    return this.usersService.approveLeaveRequest(leaveId, body.adminNotes);
  }

  @Post('leaves/:leaveId/reject')
  rejectLeave(@Param('leaveId') leaveId: string, @Body() body: { adminNotes?: string }) {
    return this.usersService.rejectLeaveRequest(leaveId, body.adminNotes);
  }

  // ===== LEADERBOARD =====

  @Get('leaderboard/ranking')
  getLeaderboard() { return this.usersService.getLeaderboard(); }

  // ===== STANDARD CRUD =====

  @Get()
  findAll() { return this.usersService.findAll(); }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
  ], { storage: memStorage }))
  async createEmployee(@Body() body: any, @UploadedFiles() files: Record<string, any[]>) {
    if (files?.photo1) body.photo1 = await this.uploadFileToCloud(files.photo1[0], 'photos');
    if (files?.photo2) body.photo2 = await this.uploadFileToCloud(files.photo2[0], 'photos');
    if (files?.photo3) body.photo3 = await this.uploadFileToCloud(files.photo3[0], 'photos');
    if (body.accountLinks && typeof body.accountLinks === 'string') {
      try { body.accountLinks = JSON.parse(body.accountLinks); } catch(e) {}
    }
    return this.usersService.createEmployee(body);
  }

  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
  ], { storage: memStorage }))
  async updateEmployee(@Param('id') id: string, @Body() body: any, @UploadedFiles() files: Record<string, any[]>) {
    if (files?.photo1) body.photo1 = await this.uploadFileToCloud(files.photo1[0], 'photos');
    if (files?.photo2) body.photo2 = await this.uploadFileToCloud(files.photo2[0], 'photos');
    if (files?.photo3) body.photo3 = await this.uploadFileToCloud(files.photo3[0], 'photos');
    return this.usersService.updateEmployee(id, body);
  }

  @Delete(':id')
  deleteEmployee(@Param('id') id: string) {
    return this.usersService.deleteEmployee(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/attendance')
  getEmployeeAttendance(@Param('id') id: string) {
    return this.usersService.getEmployeeAttendance(id);
  }

  @Get(':id/notifications')
  getEmployeeNotifications(@Param('id') id: string) {
    return this.usersService.getEmployeeNotifications(id);
  }

  @Post(':id/notifications/read/:notifId')
  markNotifRead(@Param('notifId') notifId: string) {
    return this.usersService.markNotificationRead(notifId);
  }

  @Post(':id/salary')
  addSalaryRecord(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addSalaryRecord(id, body);
  }

  @Post(':id/link')
  addAccountLink(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addAccountLink(id, body);
  }

  @Post(':id/warnings')
  addWarning(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addWarning(id, body);
  }

  @Post(':id/rewards')
  addReward(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addReward(id, body);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: any) {
    return this.usersService.addNote(id, body);
  }

  @Post(':id/fcm-token')
  saveFcmToken(@Param('id') id: string, @Body('token') token: string) {
    return this.usersService.saveFcmToken(id, token);
  }

  @Post(':id/performance')
  addPerformanceReview(@Param('id') id: string, @Body() body: { month: string; rating: number; notes?: string }) {
    return this.usersService.addPerformanceReview(id, body.month, body.rating, body.notes);
  }

  @Post(':id/contracts')
  @UseInterceptors(FileInterceptor('file', { storage: memStorage }))
  async addContract(@Param('id') id: string, @Body('title') title: string, @UploadedFile() file: any) {
    let filePath = '';
    if (file) {
      filePath = await this.uploadFileToCloud(file, 'contracts') || '';
    }
    return this.usersService.addContract(id, title, filePath);
  }

  // ===== AUDIO UPLOAD =====

  @Post('chat/upload-audio')
  @UseInterceptors(FileInterceptor('audio', { storage: memStorage }))
  async uploadAudio(@UploadedFile() file: any) {
    if (!file) return { url: null };
    const url = await this.uploadFileToCloud(file, 'audio');
    return { url };
  }

  // ===== BLOCK / BLACKLIST =====

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  async getBlockedEmployees() {
    return this.usersService.getBlockedEmployees();
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  async blockEmployee(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.usersService.blockEmployee(id, body.reason);
  }

  @Post(':id/unblock')
  @UseGuards(JwtAuthGuard)
  async unblockEmployee(@Param('id') id: string) {
    return this.usersService.unblockEmployee(id);
  }

  @Delete(':id/permanent-ban')
  @UseGuards(JwtAuthGuard)
  async permanentBan(@Param('id') id: string) {
    return this.usersService.permanentBan(id);
  }
}
