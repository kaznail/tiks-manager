import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { FirebaseService } from './firebase.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService, 
    private firebaseService: FirebaseService,
    private notificationsGateway: NotificationsGateway
  ) {}

  // ==================== EMPLOYEE CRUD ====================

  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        _count: {
          select: { reports: true, warnings: true, salaryRecords: true, rewards: true, accountLinks: true, attendance: true }
        }
      }
    });
  }

  async createEmployee(data: any) {
    const existing = await this.prisma.employee.findUnique({ where: { username: data.username } });
    if (existing) throw new BadRequestException('Username already taken');

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
        monthlyVideoTarget: data.monthlyVideoTarget !== undefined ? parseInt(data.monthlyVideoTarget) : 30,
        photo1: data.photo1,
        photo2: data.photo2,
        photo3: data.photo3,
        accountLinks: data.accountLinks && Array.isArray(data.accountLinks) ? {
          create: data.accountLinks.map((url: string) => ({ url }))
        } : undefined,
      }
    });

    await this.logActivity('إنشاء موظف جديد', `تم إنشاء حساب للموظف: ${data.name}`);
    return emp;
  }

  async updateEmployee(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.age !== undefined) updateData.age = parseInt(data.age) || null;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.province !== undefined) updateData.province = data.province;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.masterCard !== undefined) updateData.masterCard = data.masterCard;
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.allowedLeaves !== undefined) updateData.allowedLeaves = parseInt(data.allowedLeaves) || 21;
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
    if (data.monthlyVideoTarget !== undefined) updateData.monthlyVideoTarget = parseInt(data.monthlyVideoTarget) || null;
    if (data.photo1) updateData.photo1 = data.photo1;
    if (data.photo2) updateData.photo2 = data.photo2;
    if (data.photo3) updateData.photo3 = data.photo3;

    await this.logActivity('تعديل بيانات موظف', `تم تعديل بيانات الموظف ID: ${id}`);
    return this.prisma.employee.update({ where: { id }, data: updateData });
  }

  async deleteEmployee(id: string) {
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

  async findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        reports: { orderBy: { submittedAt: 'desc' }, take: 50 },
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

  // ==================== SALARY ====================

  async addSalaryRecord(id: string, body: any) {
    await this.logActivity('إصدار راتب', `تم تسليم راتب بمبلغ ${body.amount} للموظف ID: ${id}`);
    return this.prisma.salaryRecord.create({
      data: { employeeId: id, amount: parseFloat(body.amount) || 0, notes: body.notes }
    });
  }

  // ==================== ACCOUNT LINKS ====================

  async addAccountLink(id: string, body: any) {
    return this.prisma.accountLink.create({
      data: { employeeId: id, url: body.url, platform: body.platform }
    });
  }

  // ==================== WARNINGS (Smart System) ====================

  async addWarning(id: string, body: any) {
    await this.logActivity('إصدار تحذير', `تم إصدار تحذير للموظف ID: ${id} — ${body.type}`);
    return this.prisma.warning.create({
      data: { employeeId: id, type: body.type, reason: body.reason }
    });
  }

  // Create a warning REQUEST (pending admin approval)
  async createWarningRequest(employeeId: string, type: string, reason: string, autoGenerated = false) {
    return this.prisma.warningRequest.create({
      data: { employeeId, type, reason, autoGenerated }
    });
  }

  // Get all pending warning requests
  async getPendingWarningRequests() {
    return this.prisma.warningRequest.findMany({
      where: { status: 'PENDING' },
      include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, platform: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get all warning requests (history)
  async getAllWarningRequests() {
    return this.prisma.warningRequest.findMany({
      include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, username: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getIssuedWarnings() {
    return this.prisma.warning.findMany({
      include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, username: true } } },
      orderBy: { issuedAt: 'desc' }
    });
  }

  // ==================== WARNING OPERATIONS ====================
  // Approve warning request — creates an actual Warning
  async approveWarningRequest(requestId: string) {
    const req = await this.prisma.warningRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', reviewedAt: new Date() }
    });
    // Create the actual warning
    await this.addWarning(req.employeeId, { type: req.type, reason: req.reason });
    // Notify the employee
    await this.createNotification(req.employeeId, `تم إصدار تحذير بحقك: ${req.type} — ${req.reason}`, 'تحذير إداري ⚠️');
    await this.logActivity('الموافقة على تحذير', `تمت الموافقة على طلب التحذير ID: ${requestId}`);
    return req;
  }

  // Reject warning request
  async rejectWarningRequest(requestId: string) {
    await this.logActivity('رفض تحذير', `تم رفض طلب التحذير ID: ${requestId}`);
    return this.prisma.warningRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', reviewedAt: new Date() }
    });
  }

  // Remove/lift a warning
  async removeWarning(warningId: string) {
    await this.logActivity('رفع تحذير', `تم رفع التحذير ID: ${warningId}`);
    return this.prisma.warning.delete({ where: { id: warningId } });
  }

  // ==================== REWARDS ====================

  async addReward(id: string, body: any) {
    await this.logActivity('إضافة مكافأة', `تم منح مكافأة للموظف ID: ${id}`);
    return this.prisma.reward.create({
      data: { employeeId: id, reason: body.reason }
    });
  }

  // ==================== NOTES ====================

  async addNote(id: string, body: any) {
    return this.prisma.note.create({
      data: { employeeId: id, content: body.content }
    });
  }

  // ==================== FCM TOKEN ====================

  async saveFcmToken(id: string, token: string) {
    return this.prisma.employee.update({ where: { id }, data: { fcmToken: token } });
  }

  // ==================== NOTIFICATIONS ====================

  async createNotification(employeeId: string, message: string, title?: string, isAdminOnly = false) {
    const notif = await this.prisma.notification.create({
      data: { employeeId, message: `${title ? title + ': ' : ''}${message}`, isAdminOnly }
    });
    // Only send push notification if it's for the employee (not admin-only)
    if (!isAdminOnly) {
      const user = await this.prisma.employee.findUnique({ where: { id: employeeId } });
      if (user && user.fcmToken) {
        await this.firebaseService.sendPushNotification(user.fcmToken, title || 'رسالة إدارية', message);
      }
    }
    return notif;
  }

  async deleteNotification(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  // Admin sees ALL notifications (both sent to employees and admin-only)
  async getAdminNotifications() {
    return this.prisma.notification.findMany({
      include: { employee: { select: { name: true, fullName: true, id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  // Employee sees ONLY their own non-admin notifications
  async getEmployeeNotifications(employeeId: string) {
    return this.prisma.notification.findMany({
      where: { employeeId, isAdminOnly: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markNotificationRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  // ==================== ATTENDANCE (Smart) ====================

  async recordAttendance(employeeId: string, videoLinks: string[], notes?: string) {
    const today = new Date().toISOString().split('T')[0];
    
    // Upsert — update if already checked in today
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } }
    });

    if (existing) {
      // Append new links
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

  async getEmployeeAttendance(employeeId: string) {
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

  // ==================== CHAT ====================

  async sendChatMessage(employeeId: string, content: string, isFromAdmin: boolean) {
    const msg = await this.prisma.chatMessage.create({
      data: { employeeId, content, isFromAdmin }
    });
    
    // Emit notification to employee
    if (isFromAdmin) {
      this.notificationsGateway.sendNotificationToUser(employeeId, {
        type: 'chat',
        message: 'رسالة جديدة من المدير 💬'
      });
    }
    
    return msg;
  }

  async getChatMessages(employeeId: string) {
    // Mark employee messages as read when admin opens
    await this.prisma.chatMessage.updateMany({
      where: { employeeId, isFromAdmin: false, isRead: false },
      data: { isRead: true }
    });
    return this.prisma.chatMessage.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getEmployeeChatMessages(employeeId: string) {
    // Mark admin messages as read when employee opens
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

  async getUnreadCountForEmployee(employeeId: string) {
    return this.prisma.chatMessage.count({
      where: { employeeId, isFromAdmin: true, isRead: false }
    });
  }

  // ==================== ACTIVITY LOG ====================

  async logActivity(action: string, details?: string) {
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

  // ==================== PERFORMANCE REVIEWS ====================

  async addPerformanceReview(employeeId: string, month: string, rating: number, notes?: string) {
    await this.logActivity('تقييم أداء', `تم تقييم الموظف ID: ${employeeId} لشهر ${month} بتقييم ${rating}/5`);
    return this.prisma.performanceReview.upsert({
      where: { employeeId_month: { employeeId, month } },
      update: { rating, notes },
      create: { employeeId, month, rating, notes }
    });
  }

  async getPerformanceReviews(employeeId: string) {
    return this.prisma.performanceReview.findMany({
      where: { employeeId },
      orderBy: { month: 'desc' }
    });
  }

  // ==================== CONTRACTS ====================

  async addContract(employeeId: string, title: string, filePath: string) {
    await this.logActivity('رفع عقد', `تم رفع عقد "${title}" للموظف ID: ${employeeId}`);
    return this.prisma.contract.create({
      data: { employeeId, title, filePath }
    });
  }

  async deleteContract(id: string) {
    return this.prisma.contract.delete({ where: { id } });
  }

  // ==================== CALENDAR EVENTS ====================

  async createEvent(title: string, date: string, type?: string, description?: string) {
    await this.logActivity('إضافة حدث', `تم إضافة حدث: ${title} بتاريخ ${date}`);
    return this.prisma.calendarEvent.create({
      data: { title, date, type: type || 'عام', description }
    });
  }

  async getEvents() {
    return this.prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } });
  }

  async deleteEvent(id: string) {
    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  // ==================== SYSTEM SETTINGS ====================

  async getSetting(key: string) {
    return this.prisma.systemSettings.findUnique({ where: { key } });
  }

  async setSetting(key: string, value: string) {
    return this.prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  async getAllSettings() {
    return this.prisma.systemSettings.findMany();
  }

  // ==================== STATISTICS ====================

  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Run ALL queries in parallel instead of sequentially
    const [
      totalEmployees,
      totalReports,
      totalWarnings,
      totalRewards,
      totalSalaryPaid,
      pendingWarnings,
      attendanceToday,
      reportsLast7DaysRaw
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.report.count(),
      this.prisma.warning.count(),
      this.prisma.reward.count(),
      this.prisma.salaryRecord.aggregate({ _sum: { amount: true } }),
      this.prisma.warningRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.attendanceRecord.count({ where: { date: today } }),
      // Single query for all 7 days using groupBy
      this.prisma.report.groupBy({
        by: ['dateString'],
        _count: { id: true },
        where: { dateString: { gte: sevenDaysAgoStr, lte: today } }
      })
    ]);

    // Build the 7-day array from groupBy results
    const countMap = new Map(reportsLast7DaysRaw.map((r: any) => [r.dateString, r._count.id]));
    const last7Days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
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

  // ==================== MONTHLY TARGETS ====================

  async setMonthlyTarget(employeeId: string, month: string, targetCount: number) {
    await this.logActivity('تحديد هدف شهري', `تم تحديد ${targetCount} فيديو كهدف للموظف ID: ${employeeId} لشهر ${month}`);
    return this.prisma.monthlyTarget.upsert({
      where: { employeeId_month: { employeeId, month } },
      update: { targetCount },
      create: { employeeId, month, targetCount }
    });
  }

  async setBulkTarget(target: number) {
    await this.logActivity('تحديد هدف جماعي', `تم تعميم هدف شهري (${target} فيديو) لجميع الموظفين`);
    const month = new Date().toISOString().substring(0, 7);
    
    // Update base employee records
    await this.prisma.employee.updateMany({
      where: { role: 'employee' },
      data: { monthlyVideoTarget: target }
    });
    
    // Update existing monthly targets
    const employees = await this.prisma.employee.findMany({ where: { role: 'employee' } });
    for (const emp of employees) {
      await this.prisma.monthlyTarget.upsert({
        where: { employeeId_month: { employeeId: emp.id, month } },
        update: { targetCount: target }, // Modifies target without resetting achievedCount
        create: { employeeId: emp.id, month, targetCount: target, achievedCount: 0 }
      });
    }
    return { success: true, message: 'تم تعميم الهدف بنجاح لجميع الموظفين' };
  }

  async getMonthlyTarget(employeeId: string, month: string) {
    return this.prisma.monthlyTarget.findUnique({
      where: { employeeId_month: { employeeId, month } }
    });
  }

  async updateTargetAchieved(employeeId: string, increment: number) {
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

  async getAllMonthlyTargets(month: string) {
    return this.prisma.monthlyTarget.findMany({
      where: { month },
      include: { employee: { select: { id: true, name: true, fullName: true, photo1: true, platform: true, monthlyVideoTarget: true } } }
    });
  }

  // ==================== LEAVE REQUESTS ====================

  async createLeaveRequest(employeeId: string, data: { startDate: string; endDate: string; reason: string; type?: string }) {
    // Validate dates
    if (data.endDate < data.startDate) {
      throw new BadRequestException('تاريخ نهاية الإجازة يجب أن يكون بعد تاريخ البداية');
    }

    // Check for overlapping requests
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
      throw new BadRequestException('يوجد طلب إجازة متداخل مع هذه الفترة بالفعل');
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

  async getEmployeeLeaveRequests(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveLeaveRequest(id: string, adminNotes?: string) {
    const leaveReq = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true }
    });
    if (!leaveReq) throw new BadRequestException('طلب الإجازة غير موجود');
    if (leaveReq.status !== 'PENDING') throw new BadRequestException('تم مراجعة هذا الطلب مسبقاً');

    // Calculate days
    const start = new Date(leaveReq.startDate);
    const end = new Date(leaveReq.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const usedLeaves = await this.prisma.leaveRequest.count({
      where: { employeeId: leaveReq.employeeId, status: 'APPROVED' }
    });
    const allowedLeaves = leaveReq.employee.allowedLeaves || 21;
    // Count total approved leave days
    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: { employeeId: leaveReq.employeeId, status: 'APPROVED' }
    });
    const totalUsedDays = approvedLeaves.reduce((sum, l) => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      return sum + Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

    if (totalUsedDays + daysDiff > allowedLeaves) {
      throw new BadRequestException(`رصيد الإجازات غير كافٍ. المتبقي: ${allowedLeaves - totalUsedDays} يوم، المطلوب: ${daysDiff} يوم`);
    }

    const req = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', reviewedAt: new Date(), adminNotes },
      include: { employee: true }
    });

    // Create calendar event for approved leave
    await this.prisma.calendarEvent.create({
      data: { title: `إجازة: ${req.employee.name}`, date: req.startDate, type: 'إجازة', description: `${req.startDate} إلى ${req.endDate} (${daysDiff} يوم) — ${req.reason}` }
    });
    await this.createNotification(req.employeeId, `تمت الموافقة على طلب إجازتك من ${req.startDate} إلى ${req.endDate} (${daysDiff} يوم)`, 'إجازة مقبولة ✅');
    await this.logActivity('الموافقة على إجازة', `تمت الموافقة على إجازة ${req.employee.name} — ${daysDiff} يوم`);
    return req;
  }

  async rejectLeaveRequest(id: string, adminNotes?: string) {
    const leaveReq = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveReq) throw new BadRequestException('طلب الإجازة غير موجود');
    if (leaveReq.status !== 'PENDING') throw new BadRequestException('تم مراجعة هذا الطلب مسبقاً');

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

  // ==================== LEADERBOARD ====================

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

  // ==================== SALARY CHANGE LOG ====================

  async getSalaryChangeLogs(employeeId: string) {
    return this.prisma.salaryChangeLog.findMany({
      where: { employeeId },
      orderBy: { changedAt: 'desc' }
    });
  }

  // ==================== PASSWORD CHANGE ====================

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.employee.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('المستخدم غير موجود');
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.employee.update({ where: { id: userId }, data: { password: hashed } });
    await this.logActivity('تغيير كلمة مرور', `قام الموظف ${user.name} بتغيير كلمة مروره`);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  // ==================== SELF ASSESSMENT ====================

  async submitSelfAssessment(employeeId: string, month: string, rating: number, notes?: string) {
    return this.prisma.performanceReview.upsert({
      where: { employeeId_month: { employeeId, month: 'self-' + month } },
      update: { rating, notes },
      create: { employeeId, month: 'self-' + month, rating, notes }
    });
  }

  async getSelfAssessment(employeeId: string, month: string) {
    return this.prisma.performanceReview.findUnique({
      where: { employeeId_month: { employeeId, month: 'self-' + month } }
    });
  }

  // ==================== WEEKLY REPORT ====================

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

    // Daily breakdown
    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const reports = await this.prisma.report.count({ where: { dateString: dateStr } });
      const attendance = await this.prisma.attendanceRecord.count({ where: { date: dateStr, status: 'PRESENT' } });
      days.push({ date: dateStr, dayName: d.toLocaleDateString('ar-EG', { weekday: 'long' }), reports, attendance });
    }

    return { period: `${weekAgoStr} — ${now.toISOString().split('T')[0]}`, totalReports, totalAttendance, totalWarnings, totalRewards, totalLeaveRequests, totalEmployees, days };
  }

  // ==================== ACHIEVEMENTS ====================

  async getAchievements(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { _count: { select: { reports: true, rewards: true, attendance: true, warnings: true } } }
    });
    if (!emp) return [];

    const achievements: { icon: string; title: string; description: string; unlocked: boolean }[] = [];

    // Report milestones
    achievements.push({ icon: '📊', title: 'أول تقرير', description: 'أرسل تقريرك الأول', unlocked: emp._count.reports >= 1 });
    achievements.push({ icon: '📈', title: 'منتج', description: 'أرسل 10 تقارير', unlocked: emp._count.reports >= 10 });
    achievements.push({ icon: '🚀', title: 'نجم التقارير', description: 'أرسل 50 تقرير', unlocked: emp._count.reports >= 50 });
    achievements.push({ icon: '💎', title: 'أسطورة التقارير', description: 'أرسل 100 تقرير', unlocked: emp._count.reports >= 100 });

    // Attendance milestones
    achievements.push({ icon: '✅', title: 'ملتزم', description: '10 أيام حضور', unlocked: emp._count.attendance >= 10 });
    achievements.push({ icon: '🏅', title: 'منضبط', description: '30 يوم حضور', unlocked: emp._count.attendance >= 30 });
    achievements.push({ icon: '🎖️', title: 'بطل الالتزام', description: '60 يوم حضور', unlocked: emp._count.attendance >= 60 });

    // Reward milestones
    achievements.push({ icon: '⭐', title: 'أول مكافأة', description: 'احصل على مكافأة', unlocked: emp._count.rewards >= 1 });
    achievements.push({ icon: '🌟', title: 'نجم المكافآت', description: 'احصل على 5 مكافآت', unlocked: emp._count.rewards >= 5 });

    // Clean record
    achievements.push({ icon: '🛡️', title: 'سجل نظيف', description: 'بدون تحذيرات', unlocked: emp._count.warnings === 0 });

    return achievements;
  }

  // ==================== MONTHLY COMPARISON ====================

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

    const calcChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return {
      currentMonth, lastMonth,
      reports: { current: currentReports, last: lastReports, change: calcChange(currentReports, lastReports) },
      warnings: { current: currentWarnings, last: lastWarnings, change: calcChange(currentWarnings, lastWarnings) },
      attendance: { current: currentAttendance, last: lastAttendance, change: calcChange(currentAttendance, lastAttendance) },
    };
  }

  // ==================== FINANCE & VIRTUAL WALLET ====================

  async createFinanceRequest(employeeId: string, amount: number, notes?: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new Error('Employee not found');
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

  async getEmployeeFinanceRequests(empId: string) {
    return this.prisma.financialRequest.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveFinanceRequest(id: string, adminNotes?: string) {
    const req = await this.prisma.financialRequest.findUnique({ where: { id } });
    if (!req || req.status !== 'PENDING') throw new Error('Invalid request or already processed');

    // Deduct balance and create salary record
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

  async rejectFinanceRequest(id: string, adminNotes?: string) {
    return this.prisma.financialRequest.update({
      where: { id },
      data: { status: 'REJECTED', adminNotes }
    });
  }

  async updateBalance(employeeId: string, amount: number, notes?: string) {
    // Admin directly modifies current balance (e.g., adding monthly salary or adjusting)
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { currentBalance: amount }
    });
  }

  // ==================== DAILY OPERATIONS ====================

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
        videoCountToday: emp.reports.length, // use actual approved reports count!
        todayLinks: emp.reports.map(r => r.tiktokUrl),
        originalTarget: target ? target.targetCount : (emp.monthlyVideoTarget || 0),
        achievedTarget: target ? target.achievedCount : 0,
      };
    });
  }

  // ==================== BLOCK / BLACKLIST ====================

  /** Temporarily block an employee (blacklist) */
  async blockEmployee(id: string, reason?: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new BadRequestException('الموظف غير موجود');
    if (emp.isBlocked) throw new BadRequestException('الموظف محظور بالفعل');

    await this.prisma.employee.update({
      where: { id },
      data: { isBlocked: true, blockedReason: reason || 'حظر من قبل المدير', blockedAt: new Date() }
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: { action: '🚫 حظر موظف', details: `تم حظر ${emp.fullName || emp.name} — السبب: ${reason || 'غير محدد'}` }
    });

    return { success: true, message: `تم حظر ${emp.fullName || emp.name} بنجاح` };
  }

  /** Unblock an employee (remove from blacklist) */
  async unblockEmployee(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new BadRequestException('الموظف غير موجود');
    if (!emp.isBlocked) throw new BadRequestException('الموظف غير محظور');

    await this.prisma.employee.update({
      where: { id },
      data: { isBlocked: false, blockedReason: null, blockedAt: null }
    });

    await this.prisma.activityLog.create({
      data: { action: '✅ رفع الحظر', details: `تم رفع الحظر عن ${emp.fullName || emp.name}` }
    });

    return { success: true, message: `تم رفع الحظر عن ${emp.fullName || emp.name}` };
  }

  /** Permanent ban — delete ALL employee data */
  async permanentBan(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new BadRequestException('الموظف غير موجود');

    const empName = emp.fullName || emp.name;

    // Delete all related data in order (to avoid FK constraints)
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

    // Delete the employee itself
    await this.prisma.employee.delete({ where: { id } });

    await this.prisma.activityLog.create({
      data: { action: '⛔ حظر دائم وحذف', details: `تم حذف جميع بيانات ${empName} نهائياً من النظام` }
    });

    return { success: true, message: `تم حذف ${empName} وجميع بياناته نهائياً` };
  }

  /** Get all blocked employees */
  async getBlockedEmployees() {
    return this.prisma.employee.findMany({
      where: { isBlocked: true },
      select: { id: true, name: true, fullName: true, username: true, photo1: true, platform: true, blockedReason: true, blockedAt: true }
    });
  }
}
