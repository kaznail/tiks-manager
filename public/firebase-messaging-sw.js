importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

// ⚠️ SECURITY NOTE:
// Firebase API keys are designed to be public in client-side code.
// They identify your Firebase project but do NOT grant access to data.
// Data access is controlled by Firebase Security Rules configured in Firebase Console.
// Make sure your Firestore/RTDB rules restrict read/write to authenticated users only.
// Reference: https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: "AIzaSyB0ecOQyUntg5BkxFvt-sHY9PVq8CMyxFE",
  authDomain: "dffdfdffdf-5d8ab.firebaseapp.com",
  projectId: "dffdfdffdf-5d8ab",
  storageBucket: "dffdfdffdf-5d8ab.firebasestorage.app",
  messagingSenderId: "547280350564",
  appId: "1:547280350564:web:e5ee3e892c8c785d1c1e71",
  measurementId: "G-DVYGK1J200"
};

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || "إشعار جديد للإدارة";
  const notificationOptions = {
    body: payload.notification?.body || "لديك تحديث جديد، يرجى قراءته.",
    icon: "/favicon.ico",
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
