import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  async loginAdmin(@Body() body: { adminCode: string, secondaryCode?: string }) {
    if (!body.adminCode) {
      throw new UnauthorizedException('Admin code is required');
    }
    
    const admin = await this.authService.validateAdminCode(body.adminCode, body.secondaryCode);
    if (!admin) {
      throw new UnauthorizedException('Invalid Access Code');
    }
    return this.authService.loginAdmin(admin);
  }

  @Post('employee/login')
  async loginEmployee(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const employee = await this.authService.validateEmployee(body.username, body.password);
    if (!employee) {
      throw new UnauthorizedException('Invalid Username or Password');
    }
    return this.authService.loginEmployee(employee);
  }
}
