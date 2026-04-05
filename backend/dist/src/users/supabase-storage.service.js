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
var SupabaseStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseStorageService = SupabaseStorageService_1 = class SupabaseStorageService {
    constructor() {
        this.logger = new common_1.Logger(SupabaseStorageService_1.name);
        this.bucketName = 'employee-files';
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key || key === 'YOUR_SERVICE_ROLE_KEY_HERE') {
            this.logger.warn('⚠️ Supabase Storage not configured. Files will be saved locally as fallback.');
            this.supabase = null;
        }
        else {
            this.supabase = (0, supabase_js_1.createClient)(url, key);
            this.initBucket();
        }
    }
    async initBucket() {
        if (!this.supabase)
            return;
        try {
            const { data: buckets } = await this.supabase.storage.listBuckets();
            const exists = buckets?.some(b => b.name === this.bucketName);
            if (!exists) {
                await this.supabase.storage.createBucket(this.bucketName, {
                    public: true,
                    fileSizeLimit: 10 * 1024 * 1024,
                });
                this.logger.log(`✅ Created storage bucket: ${this.bucketName}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to init bucket:', error.message);
        }
    }
    async uploadFile(file, folder = 'photos') {
        if (!this.supabase) {
            return null;
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
            const { data: urlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(data.path);
            return urlData.publicUrl;
        }
        catch (error) {
            this.logger.error('Upload failed:', error.message);
            return null;
        }
    }
    async uploadAudio(base64Data) {
        if (!this.supabase)
            return null;
        try {
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
        }
        catch (error) {
            this.logger.error('Audio upload failed:', error.message);
            return null;
        }
    }
    isConfigured() {
        return this.supabase !== null;
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = SupabaseStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SupabaseStorageService);
//# sourceMappingURL=supabase-storage.service.js.map