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
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
let FirebaseService = FirebaseService_1 = class FirebaseService {
    constructor() {
        this.logger = new common_1.Logger(FirebaseService_1.name);
        this.initialized = false;
        this.initFirebase();
    }
    initFirebase() {
        try {
            const serviceAccountPath = path.resolve(__dirname, '..', '..', 'service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                this.initialized = true;
                this.logger.log('Firebase Admin SDK Initialized Successfully.');
            }
            else {
                this.logger.warn('service-account.json not found! Firebase Push Notifications will not work.');
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize Firebase Admin', error);
        }
    }
    async sendPushNotification(token, title, body, data) {
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
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            return false;
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = FirebaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map