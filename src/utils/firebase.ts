import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB0ecOQyUntg5BkxFvt-sHY9PVq8CMyxFE",
  authDomain: "dffdfdffdf-5d8ab.firebaseapp.com",
  projectId: "dffdfdffdf-5d8ab",
  storageBucket: "dffdfdffdf-5d8ab.firebasestorage.app",
  messagingSenderId: "547280350564",
  appId: "1:547280350564:web:e5ee3e892c8c785d1c1e71",
  measurementId: "G-DVYGK1J200"
};

// Initialize Firebase only on client side
const app = initializeApp(firebaseConfig);

let messaging: ReturnType<typeof getMessaging> | null = null;

// Messaging is only supported in browsers that support ServiceWorkers/Push API
if (typeof window !== "undefined") {
    isSupported().then(supported => {
        if (supported) {
            messaging = getMessaging(app);
        }
    });
}

export const requestFirebaseNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: 'BGxVpUSbrKNUY2hOzTtZLXXtiVuKQ3k1Zq1Xjm7gWx9TqmTHnXtK6CI7pOAMiu24Zq2kXUXTZ14elErmzV0R3Z0'
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
       onMessage(messaging, (payload) => {
          resolve(payload);
       });
    }
  });

export { app, messaging };
