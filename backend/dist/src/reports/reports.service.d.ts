import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    submitReport(employeeId: string, tiktokUrl: string): Promise<{
        id: string;
        employeeId: string;
        submittedAt: Date;
        tiktokUrl: string;
        status: string;
        dateString: string;
    }>;
    getPendingReports(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            platform: string;
        };
    } & {
        id: string;
        employeeId: string;
        submittedAt: Date;
        tiktokUrl: string;
        status: string;
        dateString: string;
    })[]>;
    approveReport(id: string): Promise<{
        success: boolean;
    }>;
    rejectReport(id: string): Promise<{
        id: string;
        employeeId: string;
        submittedAt: Date;
        tiktokUrl: string;
        status: string;
        dateString: string;
    }>;
    getReports(): Promise<({
        employee: {
            id: string;
            name: string;
            fullName: string;
            platform: string;
        };
    } & {
        id: string;
        employeeId: string;
        submittedAt: Date;
        tiktokUrl: string;
        status: string;
        dateString: string;
    })[]>;
    handleMissingReports(): Promise<void>;
}
