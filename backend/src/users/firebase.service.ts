import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const serviceAccountPath = path.resolve(__dirname, '..', '..', 'service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
        this.logger.log('Firebase Admin SDK Initialized Successfully.');
      } else {
        this.logger.warn('service-account.json not found! Firebase Push Notifications will not work.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) {
        this.logger.warn('Cannot send push notification. Firebase is not initialized.');
        return false;
    }
    
    try {
      const message = {
        notification: { title, body },
        data: data || {},
        token: token,
      };
      
      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return false;
    }
  }
}
