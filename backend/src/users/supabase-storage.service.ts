import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly bucketName = 'employee-files';

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key || key === 'YOUR_SERVICE_ROLE_KEY_HERE') {
      this.logger.warn('⚠️ Supabase Storage not configured. Files will be saved locally as fallback.');
      this.supabase = null;
    } else {
      this.supabase = createClient(url, key);
      this.initBucket();
    }
  }

  private async initBucket() {
    if (!this.supabase) return;
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === this.bucketName);
      if (!exists) {
        await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        });
        this.logger.log(`✅ Created storage bucket: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error('Failed to init bucket:', error.message);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'photos',
  ): Promise<string> {
    // Fallback to local storage if Supabase is not configured
    if (!this.supabase) {
      return null; // Controller will handle local fallback
    }

    try {
      const ext = file.originalname?.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('Upload error:', error.message);
        return null;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      this.logger.error('Upload failed:', error.message);
      return null;
    }
  }

  async uploadAudio(base64Data: string): Promise<string> {
    if (!this.supabase) return null;

    try {
      // Remove the "audio:data:audio/webm;base64," prefix
      const cleanData = base64Data.replace(/^(audio:)?data:audio\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanData, 'base64');
      const fileName = `audio/${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, buffer, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (error) {
        this.logger.error('Audio upload error:', error.message);
        return null;
      }

      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      this.logger.error('Audio upload failed:', error.message);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.supabase !== null;
  }
}
