import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    loginAdmin(body: {
        adminCode: string;
        secondaryCode?: string;
    }): Promise<{
        access_token: string;
        role: string;
    }>;
    loginEmployee(body: {
        username: string;
        password: string;
    }): Promise<{
        access_token: string;
        role: string;
        user: any;
    }>;
}
