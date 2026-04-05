export declare class SupabaseStorageService {
    private supabase;
    private readonly logger;
    private readonly bucketName;
    constructor();
    private initBucket;
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
    uploadAudio(base64Data: string): Promise<string>;
    isConfigured(): boolean;
}
