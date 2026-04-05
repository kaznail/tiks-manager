"use client"
import React, { useState, useEffect } from 'react';
import { resolveFileUrl } from '../../../../utils/resolveFileUrl';

// ─── Constants ───
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───
interface TargetProgress {
  achieved: number;
  target: number;
}

interface RankedEmployee {
  id: string;
  name: string;
  fullName?: string;
  photo1?: string;
  platform?: string;
  reports: number;
  attendance: number;
  avgRating: number;
  rewards: number;
  warnings: number;
  score: number;
  targetProgress?: TargetProgress;
}

export default function LeaderboardPage() {
  const [ranking, setRanking] = useState<RankedEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch(API_URL + '/users/leaderboard/ranking', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setRanking(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error('فشل جلب الترتيب:', err); setLoading(false); });
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const getRankColor = (i: number) => i === 0 ? 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30' : i === 1 ? 'from-gray-400/20 to-gray-500/5 border-gray-400/30' : i === 2 ? 'from-orange-600/20 to-orange-700/5 border-orange-600/30' : 'from-surfaceContainerLowest to-surfaceContainerLowest border-outlineVariant/10';

  /** Safe first character accessor */
  const getInitial = (text?: string): string => {
    if (!text || text.length === 0) return '؟';
    return text[0];
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="text-center">
        <h1 className="text-display font-bold text-3xl mb-1 text-onSurface">🏆 ترتيب الموظفين</h1>
        <p className="text-onSurfaceVariant text-sm">تصنيف بناءً على الأداء والالتزام والتقييمات</p>
      </header>

      {/* Scoring Legend */}
      <div className="glass-card p-4 flex flex-wrap gap-4 justify-center text-xs">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">تقرير = +2 نقطة</span>
        <span className="bg-success/10 text-success px-3 py-1 rounded-full font-bold">مكافأة = +5 نقاط</span>
        <span className="bg-error/10 text-error px-3 py-1 rounded-full font-bold">تحذير = -10 نقاط</span>
        <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-bold">تقييم = +3 نقاط/نجمة</span>
        <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold">حضور = +1 نقطة</span>
      </div>

      {loading ? (
        <div className="text-center p-20 text-onSurfaceVariant">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>جاري حساب الترتيب...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center p-20 text-onSurfaceVariant"><span className="text-5xl opacity-30 block mb-4">🏆</span><p>لا يوجد موظفون بعد</p></div>
      ) : (
        <div className="flex flex-col gap-4">
          {ranking.map((emp, idx) => (
            <div key={emp.id} className={`bg-gradient-to-l ${getRankColor(idx)} border rounded-2xl p-5 flex items-center gap-5 transition-all hover:shadow-ambient ${idx < 3 ? 'shadow-lg' : ''}`}>
              {/* Rank */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 ${idx < 3 ? '' : 'bg-surfaceContainerHigh text-onSurfaceVariant'}`}>
                {idx < 3 ? medals[idx] : <span className="text-lg">{idx + 1}</span>}
              </div>

              {/* Avatar */}
              {emp.photo1 ? (
                <img src={resolveFileUrl(emp.photo1)} className={`w-14 h-14 rounded-full object-cover border-2 shrink-0 ${idx === 0 ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : 'border-outlineVariant/20'}`} alt={`صورة ${emp.fullName || emp.name}`} />
              ) : (
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-lg shrink-0">{getInitial(emp.name)}</div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-lg ${idx === 0 ? 'text-yellow-400' : ''}`}>{emp.fullName || emp.name}</p>
                <p className="text-xs text-onSurfaceVariant">{emp.platform || 'بدون منصة'}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-3 flex-wrap justify-end">
                <MiniStat icon="📊" value={emp.reports} label="تقرير" />
                <MiniStat icon="✅" value={emp.attendance} label="حضور" />
                <MiniStat icon="⭐" value={emp.avgRating} label="تقييم" />
                <MiniStat icon="🏆" value={emp.rewards} label="مكافأة" />
                <MiniStat icon="⚠️" value={emp.warnings} label="تحذير" />
                {emp.targetProgress && (
                  <div className="bg-surfaceContainerLow px-3 py-2 rounded-xl text-center min-w-[80px]">
                    <p className="text-xs font-bold text-secondary">{emp.targetProgress.achieved}/{emp.targetProgress.target}</p>
                    <p className="text-[9px] text-onSurfaceVariant">هدف الشهر</p>
                  </div>
                )}
              </div>

              {/* Score */}
              <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ${idx === 0 ? 'bg-yellow-500/20' : idx === 1 ? 'bg-gray-400/20' : idx === 2 ? 'bg-orange-600/20' : 'bg-surfaceContainerHigh'}`}>
                <span className={`font-black text-2xl ${idx === 0 ? 'text-yellow-400' : 'text-onSurface'}`}>{Math.round(emp.score)}</span>
                <span className="text-[9px] text-onSurfaceVariant font-bold">نقطة</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-surfaceContainerLow px-3 py-2 rounded-xl text-center min-w-[60px]">
      <p className="text-xs font-bold">{icon} {value}</p>
      <p className="text-[9px] text-onSurfaceVariant">{label}</p>
    </div>
  );
}
