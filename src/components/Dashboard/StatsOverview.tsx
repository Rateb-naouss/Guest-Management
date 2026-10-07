import React from 'react';
import { DashboardStats } from '../../types';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  Layers,
  Armchair,
  CheckCircle2,
} from 'lucide-react';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  confirmedOnly: boolean;
  onToggleConfirmedOnly: (val: boolean) => void;
  onFilterByStatus?: (status: 'confirmed' | 'declined' | 'no_response' | 'all') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  confirmedOnly,
  onToggleConfirmedOnly,
  onFilterByStatus,
}) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-neutral-200/70 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Seating Policy Selector */}


      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total People Expected */}
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">إجمالي الأفراد المتوقعين</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-neutral-900 tabular-nums">
              {stats.totalPeopleExpected}
            </span>
            <span className="text-xs text-neutral-500 font-medium">فرداً</span>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>من واقع <strong className="text-neutral-800 tabular-nums">{stats.totalGuests}</strong> بطاقة دعوة</span>
            <span>{stats.invitedPeople} تمت دعوتهم</span>
          </div>
        </div>

        {/* Confirmed People */}
        <div
          onClick={() => onFilterByStatus?.('confirmed')}
          className="p-5 bg-white rounded-2xl border border-emerald-200/80 shadow-xs hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">المؤكد حضورهم</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-700 tabular-nums">
              {stats.confirmedPeople}
            </span>
            <span className="text-xs text-emerald-600 font-medium">فرداً مؤكداً</span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              <strong className="text-emerald-700 tabular-nums">{stats.confirmedGuestsCount}</strong> عائلة / دعوة
            </span>
            <span className="text-emerald-700 font-medium">
              حضور مؤكد
            </span>
          </div>
        </div>

        {/* Declined People */}
        <div
          onClick={() => onFilterByStatus?.('declined')}
          className="p-5 bg-white rounded-2xl border border-rose-200/80 shadow-xs hover:border-rose-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">المعتذرون عن الحضور</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-rose-700 tabular-nums">
              {stats.declinedPeople}
            </span>
            <span className="text-xs text-rose-600 font-medium">فرداً معتذراً</span>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              <strong className="text-rose-700 tabular-nums">{stats.declinedGuestsCount}</strong> دعوة معتذرة
            </span>
            <span className="text-rose-600 font-medium">
              اعتذار مسجل
            </span>
          </div>
        </div>

        {/* No Response */}
        <div
          onClick={() => onFilterByStatus?.('no_response')}
          className="p-5 bg-white rounded-2xl border border-amber-200/80 shadow-xs hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">بانتظار الرد</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-amber-700 tabular-nums">
              {stats.noResponsePeople}
            </span>
            <span className="text-xs text-amber-600 font-medium">فرداً معلقاً</span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              <strong className="text-amber-700 tabular-nums">{stats.noResponseGuestsCount}</strong> دعوة معلقة
            </span>
            <span className="text-amber-700 font-medium tabular-nums">
              {stats.totalPeopleExpected > 0 ? Math.round((stats.noResponsePeople / stats.totalPeopleExpected) * 100) : 0}% متبقي
            </span>
          </div>
        </div>
      </div>

      {/* Hall Seating & Capacity Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Table count */}
        <div className="p-4 bg-neutral-900 text-white rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">إجمالي طاولات الحفل</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{stats.totalTables}</span>
              <span className="text-xs text-neutral-400">طاولة (سعة {stats.totalCapacity} مقعداً)</span>
            </div>
            <div className="mt-2 text-xs text-neutral-400">
              <span className="text-amber-300 font-bold tabular-nums">{stats.usedTablesCount}</span> طاولة مشغولة ·{' '}
              <span className="text-neutral-300 font-bold tabular-nums">{stats.emptyTablesCount}</span> طاولة شاغرة
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Occupied vs Available Seats */}
        <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 block font-medium">
              المقاعد المشغولة {confirmedOnly ? '(المؤكدين)' : '(المعينين)'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-neutral-900 tabular-nums">{stats.totalOccupiedSeats}</span>
              <span className="text-xs text-neutral-500">من أصل {stats.totalCapacity} مقعد</span>
            </div>
            <div className="mt-2 text-xs text-emerald-600 font-medium">
              <span className="font-bold tabular-nums">{stats.availableSeats}</span> مقعد شاغر متاح للتسكين
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
            <Armchair className="w-5 h-5" />
          </div>
        </div>

        {/* Seated Guests Ratio */}
        <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 block font-medium">حالة تسكين الضيوف على الطاولات</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-neutral-900 tabular-nums">{stats.seatedPeopleCount}</span>
              <span className="text-xs text-neutral-500">فرداً تم تسكينهم</span>
            </div>
            <div className="mt-2 text-xs text-neutral-600">
              {stats.unseatedPeopleCount > 0 ? (
                <span className="text-amber-700 font-medium tabular-nums">
                  {stats.unseatedPeopleCount} فرداً ({stats.unseatedGuestsCount} عائلة) بانتظار التسكين
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> جميع الضيوف مسكنون على الطاولات
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
