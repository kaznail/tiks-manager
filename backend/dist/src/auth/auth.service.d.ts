import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateAdminCode(code: string, secondaryCode?: string): Promise<any>;
    loginAdmin(admin: any): Promise<{
        access_token: string;
        role: string;
    }>;
    validateEmployee(username: string, pass: string): Promise<any>;
    loginEmployee(employee: any): Promise<{
        access_token: string;
        role: string;
        user: any;
    }>;
}
