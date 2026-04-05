import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseService } from './firebase.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, FirebaseService, SupabaseStorageService],
  exports: [UsersService, SupabaseStorageService],
})
export class UsersModule {}
