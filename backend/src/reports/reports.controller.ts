import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  submitReport(@Request() req, @Body() body: { tiktokUrl: string }) {
    return this.reportsService.submitReport(req.user.id, body.tiktokUrl);
  }

  @Get()
  getReports() {
    return this.reportsService.getReports();
  }

  @Get('pending')
  getPendingReports() {
    return this.reportsService.getPendingReports();
  }

  @Post(':id/approve')
  approveReport(@Param('id') id: string) {
    return this.reportsService.approveReport(id);
  }

  @Post(':id/reject')
  rejectReport(@Param('id') id: string) {
    return this.reportsService.rejectReport(id);
  }
}
