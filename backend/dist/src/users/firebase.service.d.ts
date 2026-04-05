export declare class FirebaseService {
    private readonly logger;
    private initialized;
    constructor();
    private initFirebase;
    sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<boolean>;
}
