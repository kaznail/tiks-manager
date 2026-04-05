"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const POLL_INTERVAL_NORMAL = 10000;
const POLL_INTERVAL_FAST = 3000;
const POLL_BOOST_DURATION = 15000;

// ─── Types ───
interface Employee {
  id: string;
  name: string;
  fullName?: string;
  photo1?: string;
  platform?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch(API_URL + '/users', { headers: { 'Authorization': 'Bearer ' + getToken() } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setEmployees(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب الموظفين:', err); setLoading(false); });
  }, []);

  const loadMessages = useCallback((empId: string) => {
    fetch(API_URL + '/users/chat/employee/' + empId, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch((err) => { console.error('فشل جلب الرسائل:', err); setMessages([]); });
  }, []);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    loadMessages(emp.id);
  };

  const handleSend = async (e?: React.FormEvent, contentData?: string) => {
    if (e) e.preventDefault();
    const contentToSend = contentData || newMsg.trim();
    if (!contentToSend || !selectedEmp) return;
    
    try {
      await fetch(API_URL + '/users/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ employeeId: selectedEmp.id, content: contentToSend, isFromAdmin: true })
      });
      setNewMsg('');
      setAudioBlob(null);
      loadMessages(selectedEmp.id);
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

  // Smart polling: fast after sending, normal otherwise
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_NORMAL);
  const selectedEmpRef = useRef<Employee | null>(null);
  
  // Keep ref in sync to avoid stale closures in interval
  useEffect(() => {
    selectedEmpRef.current = selectedEmp;
  }, [selectedEmp]);

  useEffect(() => {
    if (!selectedEmp) return;
    const interval = setInterval(() => {
      const emp = selectedEmpRef.current;
      if (emp) loadMessages(emp.id);
    }, pollInterval);
    return () => clearInterval(interval);
  }, [selectedEmp?.id, pollInterval, loadMessages]);

  // Speed up polling briefly after sending a message
  const boostPolling = () => {
    setPollInterval(POLL_INTERVAL_FAST);
    setTimeout(() => setPollInterval(POLL_INTERVAL_NORMAL), POLL_BOOST_DURATION);
  };

  /** Safe first character accessor */
  const getInitial = (text?: string): string => {
    if (!text || text.length === 0) return 'م';
    return text[0];
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">المحادثات الداخلية</h1>
        <p className="text-onSurfaceVariant text-sm">تواصل مباشر مع الموظفين</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 chat-container">
        {/* Employee List */}
        <div className="glass-card p-4 flex flex-col gap-2 overflow-y-auto custom-scroll">
          <h3 className="font-bold text-sm text-onSurfaceVariant mb-2">اختر موظفاً للمحادثة</h3>
          {employees.map(emp => (
            <button key={emp.id} onClick={() => selectEmployee(emp)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-right w-full ${selectedEmp?.id === emp.id ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'hover:bg-surfaceContainerHigh'}`}>
              {emp.photo1 ? (
                <img src={resolveFileUrl(emp.photo1)} className="w-10 h-10 rounded-full object-cover border" alt={`صورة ${emp.fullName || emp.name}`} />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">{getInitial(emp.name)}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{emp.fullName || emp.name}</p>
                <p className="text-[10px] text-onSurfaceVariant">{emp.platform || ''}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 glass-card flex flex-col overflow-hidden">
          {!selectedEmp ? (
            <div className="flex-1 flex items-center justify-center text-onSurfaceVariant flex-col gap-3">
              <span className="text-5xl opacity-30">💬</span>
              <p>اختر موظفاً لبدء المحادثة</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-outlineVariant/10 flex items-center gap-3 shrink-0">
                {selectedEmp.photo1 ? (
                  <img src={resolveFileUrl(selectedEmp.photo1)} className="w-10 h-10 rounded-full object-cover border" alt={`صورة ${selectedEmp.fullName || selectedEmp.name}`} />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">{getInitial(selectedEmp.name)}</div>
                )}
                <div>
                  <p className="font-bold text-sm">{selectedEmp.fullName || selectedEmp.name}</p>
                  <p className="text-[10px] text-onSurfaceVariant">محادثة مباشرة</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto custom-scroll flex flex-col gap-3">
                {messages.length === 0 ? (
                  <p className="text-center text-onSurfaceVariant text-sm mt-10">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed ${msg.isFromAdmin ? 'bg-primary/10 text-onSurface rounded-br-sm' : 'bg-surfaceContainerHigh text-onSurface rounded-bl-sm'}`}>
                      <p className="text-[10px] font-bold mb-1 opacity-60">{msg.isFromAdmin ? '🛡️ المدير' : '👤 الموظف'}</p>
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
                    <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 bg-surfaceContainerLow p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm" />
                    <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                      className={`px-4 rounded-xl flex items-center justify-center transition-all ${recording ? 'bg-error text-white animate-pulse' : 'bg-surfaceContainerLow text-primary hover:bg-primary/10'}`} title="اضغط باستمرار للتسجيل">
                      🎤
                    </button>
                    <button type="submit" disabled={!newMsg.trim()} className="gradient-bg text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-ambient transition-shadow disabled:opacity-50">إرسال</button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
