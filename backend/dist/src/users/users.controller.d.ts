import { UsersService } from './users.service';
import { SupabaseStorageService } from './supabase-storage.service';
export declare class UsersController {
    private readonly usersService;
    private readonly storageService;
    constructor(usersService: UsersService, storageService: SupabaseStorageService);
    private uploadFileToCloud;
    createFinanceRequest(body: {
        employeeId: string;
        amount: number;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        status: string;
        amount: number;
        notes: string | null;
        adminNotes: string | null;
    }>;
    getAllFinanceRequests(): Promise<({
        employee: {
            id: string;
            fullName: string;
            platform: string;
        };
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        status: string;
        amount: number;
        notes: string | null;
        adminNotes: string | null;
    })[]>;
    getEmployeeFinanceRequests(empId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        status: string;
        amount: number;
        notes: string | null;
        adminNotes: string | null;
    }[]>;
    approveFinanceRequest(id: string, body: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
    }>;
    rejectFinanceRequest(id: string, body: {
        adminNotes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        status: string;
        amount: number;
        notes: string | null;
        adminNotes: string | null;
    }>;
    updateBalance(id: string, body: {
        amount: number;
        notes?: string;
    }): Promise<{
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    }>;
    changePassword(body: {
        userId: string;
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    submitSelfAssessment(body: {
        employeeId: string;
        month: string;
        rating: number;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        notes: string | null;
        month: string;
        rating: number;
    }>;
    getSelfAssessment(empId: string, month: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        notes: string | null;
        month: string;
        rating: number;
    }>;
    getWeeklyReport(): Promise<{
        period: string;
        totalReports: number;
        totalAttendance: number;
        totalWarnings: number;
        totalRewards: number;
        totalLeaveRequests: number;
        totalEmployees: number;
        days: any[];
    }>;
    getAchievements(empId: string): Promise<{
        icon: string;
        title: string;
        description: string;
        unlocked: boolean;
    }[]>;
    getMonthlyComparison(): Promise<{
        currentMonth: string;
        lastMonth: string;
        reports: {
            current: number;
            last: number;
            change: number;
        };
        warnings: {
            current: number;
            last: number;
            change: number;
        };
        attendance: {
            current: number;
            last: number;
            change: number;
        };
    }>;
    getStats(): Promise<{
        totalEmployees: number;
        totalReports: number;
        totalWarnings: number;
        totalRewards: number;
        totalSalaryPaid: number;
        pendingWarnings: number;
        attendanceToday: number;
        reportsLast7Days: any[];
    }>;
    getAdminNotifications(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        message: string;
        isRead: boolean;
        isAdminOnly: boolean;
    })[]>;
    getActivityLogs(): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        details: string | null;
        performedBy: string;
    }[]>;
    sendNotification(body: {
        employeeId: string;
        title: string;
        message: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        message: string;
        isRead: boolean;
        isAdminOnly: boolean;
    }>;
    broadcastNotification(body: {
        title: string;
        message: string;
    }): Promise<any[]>;
    deleteNotification(notifId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        message: string;
        isRead: boolean;
        isAdminOnly: boolean;
    }>;
    getPendingWarnings(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            platform: string;
            photo1: string;
        };
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        autoGenerated: boolean;
        reviewedAt: Date | null;
    })[]>;
    getAllWarnings(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            photo1: string;
        };
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        autoGenerated: boolean;
        reviewedAt: Date | null;
    })[]>;
    createWarningRequest(body: {
        employeeId: string;
        type: string;
        reason: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        autoGenerated: boolean;
        reviewedAt: Date | null;
    }>;
    approveWarning(reqId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        autoGenerated: boolean;
        reviewedAt: Date | null;
    }>;
    rejectWarning(reqId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        autoGenerated: boolean;
        reviewedAt: Date | null;
    }>;
    removeWarning(warningId: string): Promise<{
        id: string;
        employeeId: string;
        reason: string | null;
        issuedAt: Date;
        type: string;
    }>;
    getDailyOperations(): Promise<{
        id: string;
        fullName: string;
        platform: string;
        attendanceStatus: string;
        videoCountToday: number;
        todayLinks: string[];
        originalTarget: number;
        achievedTarget: number;
    }[]>;
    getAttendanceToday(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            photo1: string;
        };
    } & {
        id: string;
        employeeId: string;
        status: string;
        notes: string | null;
        date: string;
        videoLinks: string | null;
        videoCount: number;
        checkInTime: Date;
    })[]>;
    recordAttendance(body: {
        employeeId: string;
        videoLinks: string[];
        notes?: string;
    }): Promise<{
        id: string;
        employeeId: string;
        status: string;
        notes: string | null;
        date: string;
        videoLinks: string | null;
        videoCount: number;
        checkInTime: Date;
    }>;
    sendChatMessage(body: {
        employeeId: string;
        content: string;
        isFromAdmin: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        content: string;
        isRead: boolean;
        isFromAdmin: boolean;
    }>;
    getChatMessages(empId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        content: string;
        isRead: boolean;
        isFromAdmin: boolean;
    }[]>;
    getEmployeeChatMessages(empId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        content: string;
        isRead: boolean;
        isFromAdmin: boolean;
    }[]>;
    getEvents(): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        date: string;
        title: string;
        description: string | null;
    }[]>;
    createEvent(body: {
        title: string;
        date: string;
        type?: string;
        description?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        date: string;
        title: string;
        description: string | null;
    }>;
    deleteEvent(eventId: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        date: string;
        title: string;
        description: string | null;
    }>;
    getSettings(): Promise<{
        id: string;
        key: string;
        value: string;
        updatedAt: Date;
    }[]>;
    setSetting(body: {
        key: string;
        value: string;
    }): Promise<{
        id: string;
        key: string;
        value: string;
        updatedAt: Date;
    }>;
    setMonthlyTarget(body: {
        employeeId: string;
        month: string;
        targetCount: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        month: string;
        targetCount: number;
        achievedCount: number;
    }>;
    getAllTargets(month: string): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            platform: string;
            monthlyVideoTarget: number;
            photo1: string;
        };
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        month: string;
        targetCount: number;
        achievedCount: number;
    })[]>;
    getTarget(empId: string, month: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        month: string;
        targetCount: number;
        achievedCount: number;
    }>;
    getPendingLeaves(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            platform: string;
            allowedLeaves: number;
            photo1: string;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: string;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        reviewedAt: Date | null;
        endDate: string;
        adminNotes: string | null;
    })[]>;
    getAllLeaves(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            photo1: string;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: string;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        reviewedAt: Date | null;
        endDate: string;
        adminNotes: string | null;
    })[]>;
    getLeaveStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        onLeaveNow: ({
            employee: {
                id: string;
                name: string;
                fullName: string;
                photo1: string;
            };
        } & {
            id: string;
            createdAt: Date;
            startDate: string;
            employeeId: string;
            reason: string;
            status: string;
            type: string;
            reviewedAt: Date | null;
            endDate: string;
            adminNotes: string | null;
        })[];
    }>;
    getEmployeeLeaves(empId: string): Promise<{
        id: string;
        createdAt: Date;
        startDate: string;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        reviewedAt: Date | null;
        endDate: string;
        adminNotes: string | null;
    }[]>;
    createLeaveRequest(body: {
        employeeId: string;
        startDate: string;
        endDate: string;
        reason: string;
        type?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        startDate: string;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        reviewedAt: Date | null;
        endDate: string;
        adminNotes: string | null;
    }>;
    approveLeave(leaveId: string, body: {
        adminNotes?: string;
    }): Promise<{
        employee: {
            id: string;
            name: string;
            username: string;
            password: string;
            fullName: string | null;
            age: number | null;
            education: string | null;
            province: string | null;
            gender: string | null;
            masterCard: string | null;
            platform: string | null;
            allowedLeaves: number;
            currentBalance: number;
            salary: number | null;
            monthlyVideoTarget: number | null;
            startDate: Date;
            fcmToken: string | null;
            photo1: string | null;
            photo2: string | null;
            photo3: string | null;
            role: string;
            isBlocked: boolean;
            blockedReason: string | null;
            blockedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: string;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        reviewedAt: Date | null;
        endDate: string;
        adminNotes: string | null;
    }>;
    rejectLeave(leaveId: string, body: {
        adminNotes?: string;
    }): Promise<{
        employee: {
            id: string;
            name: string;
            username: string;
            password: string;
            fullName: string | null;
            age: number | null;
            education: string | null;
            province: string | null;
            gender: string | null;
            masterCard: string | null;
            platform: string | null;
            allowedLeaves: number;
            currentBalance: number;
            salary: number | null;
            monthlyVideoTarget: number | null;
            startDate: Date;
            fcmToken: string | null;
            photo1: string | null;
            photo2: string | null;
            photo3: string | null;
            role: string;
            isBlocked: boolean;
            blockedReason: string | null;
            blockedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: string;
        employeeId: string;
        reason: string;
        status: string;
        type: string;
        reviewedAt: Date | null;
        endDate: string;
        adminNotes: string | null;
    }>;
    getLeaderboard(): Promise<{
        id: string;
        name: string;
        fullName: string;
        photo1: string;
        platform: string;
        reports: number;
        warnings: number;
        rewards: number;
        attendance: number;
        avgRating: number;
        targetProgress: {
            target: number;
            achieved: number;
        };
        score: number;
    }[]>;
    findAll(): Promise<({
        _count: {
            reports: number;
            warnings: number;
            rewards: number;
            accountLinks: number;
            salaryRecords: number;
            attendance: number;
        };
    } & {
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    })[]>;
    createEmployee(body: any, files: Record<string, any[]>): Promise<{
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    }>;
    updateEmployee(id: string, body: any, files: Record<string, any[]>): Promise<{
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    }>;
    deleteEmployee(id: string): Promise<{
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    }>;
    findOne(id: string): Promise<{
        reports: {
            id: string;
            employeeId: string;
            submittedAt: Date;
            tiktokUrl: string;
            status: string;
            dateString: string;
        }[];
        warnings: {
            id: string;
            employeeId: string;
            reason: string | null;
            issuedAt: Date;
            type: string;
        }[];
        rewards: {
            id: string;
            employeeId: string;
            reason: string;
            issuedAt: Date;
        }[];
        receivedNotes: {
            id: string;
            createdAt: Date;
            employeeId: string;
            content: string;
        }[];
        accountLinks: {
            id: string;
            createdAt: Date;
            platform: string | null;
            url: string;
            employeeId: string;
        }[];
        salaryRecords: {
            id: string;
            employeeId: string;
            paidAt: Date;
            amount: number;
            notes: string | null;
        }[];
        warningRequests: {
            id: string;
            createdAt: Date;
            employeeId: string;
            reason: string;
            status: string;
            type: string;
            autoGenerated: boolean;
            reviewedAt: Date | null;
        }[];
        attendance: {
            id: string;
            employeeId: string;
            status: string;
            notes: string | null;
            date: string;
            videoLinks: string | null;
            videoCount: number;
            checkInTime: Date;
        }[];
        performanceReviews: {
            id: string;
            createdAt: Date;
            employeeId: string;
            notes: string | null;
            month: string;
            rating: number;
        }[];
        contracts: {
            id: string;
            createdAt: Date;
            employeeId: string;
            title: string;
            filePath: string;
        }[];
        monthlyTargets: {
            id: string;
            createdAt: Date;
            employeeId: string;
            month: string;
            targetCount: number;
            achievedCount: number;
        }[];
        leaveRequests: {
            id: string;
            createdAt: Date;
            startDate: string;
            employeeId: string;
            reason: string;
            status: string;
            type: string;
            reviewedAt: Date | null;
            endDate: string;
            adminNotes: string | null;
        }[];
        salaryChangeLogs: {
            id: string;
            employeeId: string;
            oldSalary: number;
            newSalary: number;
            reason: string | null;
            changedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    }>;
    getEmployeeAttendance(id: string): Promise<{
        id: string;
        employeeId: string;
        status: string;
        notes: string | null;
        date: string;
        videoLinks: string | null;
        videoCount: number;
        checkInTime: Date;
    }[]>;
    getEmployeeNotifications(id: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        message: string;
        isRead: boolean;
        isAdminOnly: boolean;
    }[]>;
    markNotifRead(notifId: string): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        message: string;
        isRead: boolean;
        isAdminOnly: boolean;
    }>;
    addSalaryRecord(id: string, body: any): Promise<{
        id: string;
        employeeId: string;
        paidAt: Date;
        amount: number;
        notes: string | null;
    }>;
    addAccountLink(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        platform: string | null;
        url: string;
        employeeId: string;
    }>;
    addWarning(id: string, body: any): Promise<{
        id: string;
        employeeId: string;
        reason: string | null;
        issuedAt: Date;
        type: string;
    }>;
    addReward(id: string, body: any): Promise<{
        id: string;
        employeeId: string;
        reason: string;
        issuedAt: Date;
    }>;
    addNote(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        content: string;
    }>;
    saveFcmToken(id: string, token: string): Promise<{
        id: string;
        name: string;
        username: string;
        password: string;
        fullName: string | null;
        age: number | null;
        education: string | null;
        province: string | null;
        gender: string | null;
        masterCard: string | null;
        platform: string | null;
        allowedLeaves: number;
        currentBalance: number;
        salary: number | null;
        monthlyVideoTarget: number | null;
        startDate: Date;
        fcmToken: string | null;
        photo1: string | null;
        photo2: string | null;
        photo3: string | null;
        role: string;
        isBlocked: boolean;
        blockedReason: string | null;
        blockedAt: Date | null;
    }>;
    addPerformanceReview(id: string, body: {
        month: string;
        rating: number;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        notes: string | null;
        month: string;
        rating: number;
    }>;
    addContract(id: string, title: string, file: any): Promise<{
        id: string;
        createdAt: Date;
        employeeId: string;
        title: string;
        filePath: string;
    }>;
    uploadAudio(file: any): Promise<{
        url: string;
    }>;
    getBlockedEmployees(): Promise<{
        id: string;
        name: string;
        username: string;
        fullName: string;
        platform: string;
        photo1: string;
        blockedReason: string;
        blockedAt: Date;
    }[]>;
    blockEmployee(id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    unblockEmployee(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    permanentBan(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
