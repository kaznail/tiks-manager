"use client"
import { useEffect } from 'react';
import { requestFirebaseNotificationPermission, onMessageListener } from '../utils/firebase';

export default function FirebaseInit() {
  useEffect(() => {
    const initializePush = async () => {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) return;

      // Ensure service worker is registered
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker Registered');
        } catch (e) {
          console.error('SW Registration failing', e);
        }
      }

      const fcmToken = await requestFirebaseNotificationPermission();
      if (fcmToken) {
        console.log('Firebase Token:', fcmToken);
        // Send to backend (Assuming we know the user ID, but token itself doesn't contain ID unless decoded. 
        // For simplicity, we just send it to a generic "me" endpoint or decode JWT. Since we don't have a /me, we could decode JWT here, or rely on a generic backend route).
        
        // Decoding JWT (Base64 approach)
        try {
           const payload = JSON.parse(atob(token.split('.')[1]));
           const userId = payload.sub || payload.id;
           if (userId) {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${userId}/fcm-token`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ token: fcmToken })
              });
           }
        } catch (e) {}
      }
    };

    initializePush();

    onMessageListener().then(payload => {
       console.log('Foreground Message Received:', payload);
       // We can show a toast notification here later
    }).catch(err => console.log('failed: ', err));

  }, []);

  return null; // Invisible config component
}
