import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  async submitReport(employeeId: string, tiktokUrl: string) {
    // Accept TikTok, Instagram, YouTube, Facebook URLs (including shortened links)
    const validDomains = [
      'tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com', 'lite.tiktok.com',
      'instagram.com', 'instagr.am',
      'youtube.com', 'youtu.be',
      'facebook.com', 'fb.com', 'fb.watch',
    ];
    const isValid = validDomains.some(domain => tiktokUrl.toLowerCase().includes(domain));
    if (!isValid) {
      throw new BadRequestException('رابط غير صالح. يرجى إدخال رابط من منصة صحيحة.');
    }

    const today = new Date().toISOString().split('T')[0];

    // Check for duplicate URL
    const existingUrl = await this.prisma.report.findUnique({ where: { tiktokUrl } });
    if (existingUrl) {
      throw new BadRequestException('❌ هذا الرابط تم إرساله مسبقاً في النظام.');
    }

    // Ownership Verification (Smart Validation)
    const links = await this.prisma.accountLink.findMany({ where: { employeeId } });
    if (links.length === 0) {
      throw new BadRequestException('⚠️ لم تقم بربط حساباتك! يرجى الذهاب إلى (ملفي الشخصي) وإضافة روابط حساباتك قبل إرسال التقارير.');
    }

    // Detect the platform from the submitted URL
    const urlLower = tiktokUrl.toLowerCase();
    
    // Map of shortened/video domains to their main platform
    const platformMap: Record<string, string[]> = {
      'tiktok': ['tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com', 'lite.tiktok.com'],
      'instagram': ['instagram.com', 'instagr.am'],
      'youtube': ['youtube.com', 'youtu.be', 'youtube.com/shorts'],
      'facebook': ['facebook.com', 'fb.com', 'fb.watch'],
    };

    // Find which platform this URL belongs to
    let submittedPlatform = '';
    for (const [platform, domains] of Object.entries(platformMap)) {
      if (domains.some(d => urlLower.includes(d))) {
        submittedPlatform = platform;
        break;
      }
    }

    // Check if the URL contains @username (full profile/video URL)
    const urlUsernameMatch = urlLower.match(/@([a-zA-Z0-9_.-]+)/);

    let isOwner = false;

    for (const link of links) {
      const linkLower = link.url.toLowerCase();
      
      // Extract @username from the employee's saved account link
      const linkUsernameMatch = linkLower.match(/@([a-zA-Z0-9_.-]+)/);
      
      if (urlUsernameMatch && linkUsernameMatch) {
        // CASE 1: Both have @username → strict match
        if (urlUsernameMatch[1] === linkUsernameMatch[1]) {
          isOwner = true;
          break;
        }
      } else if (!urlUsernameMatch && submittedPlatform) {
        // CASE 2: Shortened URL (no @username) → check if employee has account on same platform
        // e.g. vt.tiktok.com/xxx → employee has tiktok.com/@user → MATCH ✅
        const linkPlatform = Object.entries(platformMap).find(([_, domains]) => 
          domains.some(d => linkLower.includes(d))
        );
        if (linkPlatform && linkPlatform[0] === submittedPlatform) {
          isOwner = true;
          break;
        }
      } else {
        // CASE 3: Fallback — simple substring check
        const cleanUrl = linkLower.replace('https://', '').replace('http://', '').trim();
        if (cleanUrl.length > 5 && urlLower.includes(cleanUrl)) {
          isOwner = true;
          break;
        }
      }
    }

    if (!isOwner) {
      throw new BadRequestException('❌ الرابط المرفق لا يعود لأي من حساباتك المسجلة لدينا. تأكد من إرسال فيديوهات حسابك فقط.');
    }

    const report = await this.prisma.report.create({
      data: {
        employeeId,
        tiktokUrl,
        dateString: today,
        status: 'PENDING', // Will wait for ADMIN approval
      }
    });

    return report;
  }

  async getPendingReports() {
    return this.prisma.report.findMany({
      where: { status: 'PENDING' },
      include: { employee: { select: { id: true, name: true, fullName: true, platform: true, photo1: true } } },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async approveReport(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report || report.status !== 'PENDING') throw new BadRequestException('التقرير غير صالح أو تم تقييمه مسبقاً.');

    await this.prisma.report.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Update monthly target (create if it doesn't exist)
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

  async rejectReport(id: string, reason?: string) {
    const report = await this.prisma.report.update({ 
      where: { id }, 
      data: { status: 'REJECTED', adminNotes: reason } 
    });
    
    // Notify employee of rejection with the reason
    const msg = reason 
      ? `⚠️ تم رفض تقريرك عن فيديو ${report.tiktokUrl}. السبب: ${reason}`
      : `⚠️ تم رفض تقريرك عن فيديو ${report.tiktokUrl}. يرجى مراجعته.`;
      
    await this.prisma.notification.create({
      data: { employeeId: report.employeeId, message: msg }
    });
    
    // Emit real-time notification
    this.notificationsGateway.sendNotificationToUser(report.employeeId, msg);
    
    return report;
  }

  async getReports() {
    return this.prisma.report.findMany({
      include: { employee: { select: { id: true, name: true, fullName: true, platform: true, photo1: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // Smart Warning System: Create WARNING REQUESTS instead of direct warnings
  @Cron('59 23 * * *')
  async handleMissingReports(customDate?: string) {
    // Determine which date to check
    const todayStr = customDate || new Date().toISOString().split('T')[0];
    
    const employees = await this.prisma.employee.findMany({ 
      where: { role: 'employee', isBlocked: false } 
    });

    for (const emp of employees) {
      const report = await this.prisma.report.findFirst({
        where: { employeeId: emp.id, dateString: todayStr }
      });

      if (!report) {
        // Create a pending WarningRequest for missed report
        await this.prisma.warningRequest.create({
          data: {
            employeeId: emp.id,
            type: 'عدم إرسال تقرير',
            reason: `تقصير تلقائي: عدم إرسال تقرير ليوم ${todayStr}`,
            autoGenerated: true,
          }
        });

        // Create attendance record as ABSENT
        const existingAtt = await this.prisma.attendanceRecord.findUnique({
          where: { employeeId_date: { employeeId: emp.id, date: todayStr } }
        });
        if (!existingAtt) {
          await this.prisma.attendanceRecord.create({
            data: {
              employeeId: emp.id,
              date: todayStr,
              status: 'ABSENT',
              videoCount: 0,
            }
          });
        }

        // Insert a dummy missed report so we don't warn again
        await this.prisma.report.create({
          data: {
            employeeId: emp.id,
            tiktokUrl: `MISSED_${todayStr}_${emp.id}`,
            status: 'MISSED',
            dateString: todayStr
          }
        });

        // Notify admin ONLY (employee must NOT see this)
        await this.prisma.notification.create({
          data: {
            employeeId: emp.id,
            message: `⚠️ تحذير تلقائي: ${emp.name} لم يرسل تقريره لتاريخ ${todayStr}. ينتظر موافقتك في صفحة التحذيرات.`,
            isAdminOnly: true,
          }
        });
      }
    }
    
    return { success: true, message: `تم الانتهاء من فحص التقارير المفقودة لتاريخ ${todayStr} وإصدار التحذيرات.` };
  }
}
