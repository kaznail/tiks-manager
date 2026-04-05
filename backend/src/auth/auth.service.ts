import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // 1. Admin Login Logic
  async validateAdminCode(code: string, secondaryCode?: string): Promise<any> {
    const admin = await this.prisma.admin.findFirst();
    if (!admin) return null; // Edge case: not seeded yet

    const isMatch = await bcrypt.compare(code, admin.adminCodeHash);
    if (!isMatch) return null;

    // Check Secondary Code from settings
    const adminSecondarySetting = await this.prisma.systemSettings.findUnique({ where: { key: 'adminSecondaryCode' } });
    if (adminSecondarySetting && adminSecondarySetting.value && adminSecondarySetting.value.trim() !== '') {
      if (secondaryCode !== adminSecondarySetting.value) {
        return null; // Secondary code missed
      }
    }

    return { id: admin.id, role: 'ADMIN' };
  }

  async loginAdmin(admin: any) {
    const payload = { sub: admin.id, role: admin.role };
    return {
      access_token: this.jwtService.sign(payload),
      role: 'ADMIN',
    };
  }

  // 2. Employee Login Logic
  async validateEmployee(username: string, pass: string): Promise<any> {
    const employee = await this.prisma.employee.findUnique({ where: { username } });
    if (!employee) return null;
    
    // Check if employee is blocked
    if (employee.isBlocked) {
      throw new UnauthorizedException('⛔ تم حظر حسابك من قبل الإدارة. تواصل مع المدير لمزيد من المعلومات.');
    }
    
    if (await bcrypt.compare(pass, employee.password)) {
      const { password, ...result } = employee;
      return result;
    }
    return null;
  }

  async loginEmployee(employee: any) {
    const payload = { 
      username: employee.username, 
      sub: employee.id, 
      role: employee.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: 'EMPLOYEE',
      user: employee
    };
  }
}
