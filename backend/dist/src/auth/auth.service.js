"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateAdminCode(code, secondaryCode) {
        const admin = await this.prisma.admin.findFirst();
        if (!admin)
            return null;
        const isMatch = await bcrypt.compare(code, admin.adminCodeHash);
        if (!isMatch)
            return null;
        const adminSecondarySetting = await this.prisma.systemSettings.findUnique({ where: { key: 'adminSecondaryCode' } });
        if (adminSecondarySetting && adminSecondarySetting.value && adminSecondarySetting.value.trim() !== '') {
            if (secondaryCode !== adminSecondarySetting.value) {
                return null;
            }
        }
        return { id: admin.id, role: 'ADMIN' };
    }
    async loginAdmin(admin) {
        const payload = { sub: admin.id, role: admin.role };
        return {
            access_token: this.jwtService.sign(payload),
            role: 'ADMIN',
        };
    }
    async validateEmployee(username, pass) {
        const employee = await this.prisma.employee.findUnique({ where: { username } });
        if (!employee)
            return null;
        if (employee.isBlocked) {
            throw new common_1.UnauthorizedException('⛔ تم حظر حسابك من قبل الإدارة. تواصل مع المدير لمزيد من المعلومات.');
        }
        if (await bcrypt.compare(pass, employee.password)) {
            const { password, ...result } = employee;
            return result;
        }
        return null;
    }
    async loginEmployee(employee) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map