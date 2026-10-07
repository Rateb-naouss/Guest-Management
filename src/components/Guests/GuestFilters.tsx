import React from 'react';
import { GuestFilters, Table } from '../../types';
import { Search, X, Filter } from 'lucide-react';

interface GuestFiltersProps {
  filters: GuestFilters;
  tables: Table[];
  onChange: (updated: Partial<GuestFilters>) => void;
  onReset: () => void;
}

export const GuestFiltersBar: React.FC<GuestFiltersProps> = ({
  filters,
  tables,
  onChange,
  onReset,
}) => {
  const hasActiveFilters =
    filters.search ||
    filters.gender !== 'all' ||
    (filters.guestSide && filters.guestSide !== 'all') ||
    filters.invitationStatus !== 'all' ||
    filters.responseStatus !== 'all' ||
    filters.tableNumber !== 'all';

  return (
    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            placeholder="البحث بالاسم أو برقم الهاتف أو الملاحظات..."
            className="w-full pr-10 pl-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-neutral-400"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '', page: 1 })}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Guest Side (Groom vs Bride) */}
          <select
            value={filters.guestSide || 'all'}
            onChange={(e) => onChange({ guestSide: e.target.value as any, page: 1 })}
            className="py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
          >
            <option value="all">طرف الدعوة: الكل</option>
            <option value="groom">🤵 ضيوف العريس</option>
            <option value="bride">👰 ضيوف العروس</option>
          </select>

          {/* Gender */}
          <select
            value={filters.gender}
            onChange={(e) => onChange({ gender: e.target.value as any, page: 1 })}
            className="py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
          >
            <option value="all">الجنس: الكل</option>
            <option value="male">ذكور فقط</option>
            <option value="female">إناث فقط</option>
          </select>

          {/* Invitation Status */}
          <select
            value={filters.invitationStatus}
            onChange={(e) => onChange({ invitationStatus: e.target.value as any, page: 1 })}
            className="py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
          >
            <option value="all">الدعوة: الكل</option>
            <option value="invited">تمت الدعوة</option>
            <option value="not_invited">لم تتم الدعوة</option>
          </select>

          {/* Response Status */}
          <select
            value={filters.responseStatus}
            onChange={(e) => onChange({ responseStatus: e.target.value as any, page: 1 })}
            className="py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
          >
            <option value="all">الرد: الكل</option>
            <option value="confirmed">مؤكد الحضور</option>
            <option value="declined">معتذر</option>
            <option value="no_response">بانتظار الرد</option>
          </select>

          {/* Table */}
          <select
            value={filters.tableNumber}
            onChange={(e) => onChange({ tableNumber: e.target.value as any, page: 1 })}
            className="py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
          >
            <option value="all">الطاولة: الكل</option>
            <option value="unassigned">غير مسكن</option>
            {tables.map((t) => (
              <option key={t.tableNumber} value={t.tableNumber}>
                طاولة {t.tableNumber} ({t.currentPeople}/{t.maxCapacity})
              </option>
            ))}
          </select>
        </div>

        {/* Sort and Reset */}
        <div className="flex items-center gap-2">
          <select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              onChange({ sortBy: sortBy as any, sortOrder: sortOrder as any });
            }}
            className="py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shrink-0"
          >
            <option value="createdAt_desc">الأحدث إضافة</option>
            <option value="fullName_asc">الاسم (أ - ي)</option>
            <option value="totalGroupMembers_desc">حجم المجموعة (الأكبر)</option>
            <option value="totalGroupMembers_asc">حجم المجموعة (الأصغر)</option>
            <option value="tableNumber_asc">رقم الطاولة</option>
            <option value="responseStatus_asc">حالة الرد</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors whitespace-nowrap"
              title="إعادة ضبط الفلاتر"
            >
              <X className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
