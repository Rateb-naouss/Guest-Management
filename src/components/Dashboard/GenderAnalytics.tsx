import React from 'react';
import { DashboardStats } from '../../types';
import { Users2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface GenderAnalyticsProps {
  stats: DashboardStats | null;
}

export const GenderAnalytics: React.FC<GenderAnalyticsProps> = ({ stats }) => {
  if (!stats) return null;

  const totalPeople = stats.totalPeopleExpected || 1;
  const malePercent = Math.round((stats.totalMales / totalPeople) * 100);
  const femalePercent = Math.round((stats.totalFemales / totalPeople) * 100);

  const confirmedTotal = (stats.confirmedMales + stats.confirmedFemales) || 1;
  const confirmedMalePercent = Math.round((stats.confirmedMales / confirmedTotal) * 100);
  const confirmedFemalePercent = Math.round((stats.confirmedFemales / confirmedTotal) * 100);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-neutral-900">إحصائيات الرجال والنساء</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            يتم حساب الإحصائيات آلياً من قاعدة البيانات باحتساب الضيف الرئيسي وجميع أفراد أسرته المرافقين
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>ذكور ({stats.totalMales})</span>
          </div>
          <div className="flex items-center gap-1.5 text-pink-700">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
            <span>إناث ({stats.totalFemales})</span>
          </div>
        </div>
      </div>

      {/* Main ratio visualization */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-neutral-700">
          <span className="text-blue-700">الذكور: {stats.totalMales} فرداً ({malePercent}%)</span>
          <span className="text-pink-700">الإناث: {stats.totalFemales} فرداً ({femalePercent}%)</span>
        </div>
        <div className="w-full h-3 bg-neutral-100 rounded-full flex overflow-hidden">
          <div
            className="bg-blue-600 transition-all duration-300"
            style={{ width: `${malePercent}%` }}
            title={`ذكور: ${stats.totalMales}`}
          />
          <div
            className="bg-pink-500 transition-all duration-300"
            style={{ width: `${femalePercent}%` }}
            title={`إناث: ${stats.totalFemales}`}
          />
        </div>
      </div>

      {/* 3 Dedicated Breakdown Cards: Total / Confirmed / Declined */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Gender Stats */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80">
            <span className="text-xs font-bold text-neutral-800">إجمالي المدعوين</span>
            <span className="text-xs font-bold text-neutral-500 tabular-nums">{stats.totalPeopleExpected} فرداً</span>
          </div>
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                إجمالي الذكور:
              </span>
              <span className="font-extrabold text-neutral-900 tabular-nums">{stats.totalMales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                إجمالي الإناث:
              </span>
              <span className="font-extrabold text-neutral-900 tabular-nums">{stats.totalFemales}</span>
            </div>
          </div>
        </div>

        {/* Confirmed Gender Stats */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> المؤكد حضورهم
            </span>
            <span className="text-xs font-bold text-emerald-700 tabular-nums">{stats.confirmedPeople} فرداً</span>
          </div>
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                الذكور المؤكدون:
              </span>
              <span className="font-extrabold text-emerald-800 tabular-nums">{stats.confirmedMales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                الإناث المؤكدات:
              </span>
              <span className="font-extrabold text-emerald-800 tabular-nums">{stats.confirmedFemales}</span>
            </div>
          </div>
        </div>

        {/* Declined Gender Stats */}
        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200/80">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" /> المعتذرون عن الحضور
            </span>
            <span className="text-xs font-bold text-rose-700 tabular-nums">{stats.declinedPeople} فرداً</span>
          </div>
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                الذكور المعتذرون:
              </span>
              <span className="font-extrabold text-rose-800 tabular-nums">{stats.declinedMales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                الإناث المعتذرات:
              </span>
              <span className="font-extrabold text-rose-800 tabular-nums">{stats.declinedFemales}</span>
            </div>
          </div>
        </div>
      </div>

      {/* No response gender pill */}
      <div className="p-3 rounded-xl bg-neutral-100/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-neutral-800">الضيوف بانتظار الرد:</span>
          <span>{stats.noResponsePeople} فرداً إجمالاً</span>
        </div>
        <div className="flex items-center gap-4">
          <span>ذكور بانتظار الرد: <strong className="text-neutral-900 tabular-nums">{stats.noResponseMales}</strong></span>
          <span>إناث بانتظار الرد: <strong className="text-neutral-900 tabular-nums">{stats.noResponseFemales}</strong></span>
        </div>
      </div>
    </div>
  );
};
