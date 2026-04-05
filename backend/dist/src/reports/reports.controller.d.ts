import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    submitReport(req: any, body: {
        tiktokUrl: string;
    }): Promise<{
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
}
