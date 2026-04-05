"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const POLL_INTERVAL_NORMAL = 10000;
const POLL_INTERVAL_FAST = 3000;
const POLL_BOOST_DURATION = 15000;

// ─── Types ───
interface ChatMessage {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
}

export default function EmployeeChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  
  const getUserId = useMemo(() => {
    return (): string | null => {
      try {
        const token = getToken();
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const decoded = JSON.parse(atob(parts[1]));
        return decoded?.sub || decoded?.id || null;
      } catch (err) {
        console.error('فشل فك تشفير التوكن:', err);
        return null;
      }
    };
  }, []);

  const loadMessages = useCallback(() => {
    const userId = getUserId();
    if (!userId) return;
    fetch(API_URL + '/users/chat/my-messages/' + userId, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch((err) => { console.error('فشل جلب الرسائل:', err); setLoading(false); });
  }, [getUserId]);

  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_NORMAL);
  
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, loadMessages]);

  const boostPolling = () => {
    setPollInterval(POLL_INTERVAL_FAST);
    setTimeout(() => setPollInterval(POLL_INTERVAL_NORMAL), POLL_BOOST_DURATION);
  };

  const handleSend = async (e?: React.FormEvent, contentData?: string) => {
    if (e) e.preventDefault();
    const userId = getUserId();
    const contentToSend = contentData || newMsg.trim();
    if (!contentToSend || !userId) return;
    
    try {
      await fetch(API_URL + '/users/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ employeeId: userId, content: contentToSend, isFromAdmin: false })
      });
      setNewMsg('');
      setAudioBlob(null);
      loadMessages();
      boostPolling();
    } catch (err) {
      console.error('فشل إرسال الرسالة:', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error('فشل الوصول للميكروفون:', err);
      alert('تعذر الوصول إلى الميكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const sendAudio = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      handleSend(undefined, `audio:${base64data}`);
    };
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">المحادثة مع الإدارة</h1>
        <p className="text-onSurfaceVariant text-sm">تواصل مباشر مع المدير</p>
      </header>

      <div className="glass-card flex flex-col overflow-hidden chat-container">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto custom-scroll flex flex-col gap-3">
          {loading ? (
            <p className="text-center text-onSurfaceVariant text-sm mt-10">جاري التحميل...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-onSurfaceVariant text-sm mt-10">لا توجد رسائل بعد. ابدأ بإرسال رسالة للمدير!</p>
          ) : messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${msg.isFromAdmin ? 'bg-primary/10 text-onSurface rounded-bl-sm' : 'bg-surfaceContainerHigh text-onSurface rounded-br-sm'}`}>
                <p className="text-[10px] font-bold mb-1 opacity-60">{msg.isFromAdmin ? '🛡️ المدير' : '👤 أنت'}</p>
                {msg.content.startsWith('audio:') ? (
                  <audio controls className="h-8 max-w-[200px]" src={msg.content.substring(6)} />
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className="text-[9px] mt-1 opacity-50 text-left" dir="ltr">{new Date(msg.createdAt).toLocaleString('ar-EG')}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-outlineVariant/10 flex flex-col gap-2 shrink-0">
          {audioBlob && (
            <div className="flex items-center gap-3 bg-surfaceContainerLow p-2 rounded-xl border border-outlineVariant/20">
              <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" />
              <button onClick={sendAudio} className="text-sm font-bold bg-success text-white px-4 py-1.5 rounded-lg hover:brightness-110">إرسال ✈️</button>
              <button onClick={() => setAudioBlob(null)} className="text-xs text-error font-bold px-2">إلغاء 🗑️</button>
            </div>
          )}
          
          {!audioBlob && (
            <form onSubmit={handleSend} className="flex gap-3">
              <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="اكتب رسالتك للمدير..." className="flex-1 bg-surfaceContainerLow p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm" />
              <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                className={`px-4 rounded-xl flex items-center justify-center transition-all ${recording ? 'bg-error text-white animate-pulse' : 'bg-surfaceContainerLow text-primary hover:bg-primary/10'}`} title="اضغط باستمرار للتسجيل">
                🎤
              </button>
              <button type="submit" disabled={!newMsg.trim()} className="gradient-bg text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-ambient transition-shadow disabled:opacity-50">إرسال</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
