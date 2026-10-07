import React from 'react';
import { Table, Guest } from '../../types';
import {
  UtensilsCrossed,
  UserMinus,
  Edit,
  Trash2,
  UserPlus,
  Users,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface TableCardProps {
  table: Table;
  onEditTable: (table: Table) => void;
  onDeleteTable: (table: Table) => void;
  onRemoveGuest: (tableNumber: number, guestId: string) => void;
  onAssignGuestClick: (table: Table) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  onEditTable,
  onDeleteTable,
  onRemoveGuest,
  onAssignGuestClick,
}) => {
  const isFull = table.currentPeople >= table.maxCapacity;
  const isAlmostFull = !isFull && table.remainingSeats <= 2 && table.currentPeople > 0;
  const isEmpty = table.currentPeople === 0;

  const occupancyRatio = Math.min(100, Math.round((table.currentPeople / table.maxCapacity) * 100));

  return (
    <div
      className={`rounded-2xl border bg-white shadow-xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between ${
        isFull
          ? 'border-rose-200'
          : isAlmostFull
          ? 'border-amber-200'
          : 'border-neutral-200'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center tabular-nums">
                {table.tableNumber}
              </span>
              <h3 className="font-bold text-sm text-neutral-900 font-sans">
                {table.tableName || `طاولة رقم ${table.tableNumber}`}
              </h3>
            </div>
            {table.notes && (
              <p className="text-[11px] text-neutral-400 mt-1 truncate max-w-[220px]" title={table.notes}>
                {table.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditTable(table)}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md transition-colors"
              title="تعديل سعة أو بيانات الطاولة"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteTable(table)}
              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="حذف الطاولة"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Capacity Bar & Numbers */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-600">
              المشغول: <strong className="text-neutral-900 tabular-nums">{table.currentPeople}</strong> من أصل{' '}
              <strong className="text-neutral-900 tabular-nums">{table.maxCapacity}</strong>
            </span>
            <span
              className={`tabular-nums ${
                isFull
                  ? 'text-rose-600 font-bold'
                  : isAlmostFull
                  ? 'text-amber-700 font-bold'
                  : 'text-emerald-700 font-bold'
              }`}
            >
              {isFull ? 'ممتلئة بالكامل' : `متبقي ${table.remainingSeats} مقاعد`}
            </span>
          </div>

          <div className="mt-1.5 w-full bg-neutral-200/70 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull
                  ? 'bg-rose-500'
                  : isAlmostFull
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body: Seated Guests list */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            الضيوف المسكنين ({table.assignedGuests.length} عائلة / مجموعة)
          </span>

          {!isFull && (
            <button
              onClick={() => onAssignGuestClick(table)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ تسكين ضيف</span>
            </button>
          )}
        </div>

        {table.assignedGuests.length === 0 ? (
          <div className="py-6 text-center text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
            الطاولة فارغة تماماً
            <div className="mt-1">
              <button
                onClick={() => onAssignGuestClick(table)}
                className="text-amber-800 font-semibold hover:underline"
              >
                انقر لتسكين ضيف هنا
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {table.assignedGuests.map((guest) => (
              <div
                key={guest._id}
                className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/70 hover:bg-neutral-100/70 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>{guest.fullName}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        guest.responseStatus === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : guest.responseStatus === 'declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {guest.responseStatus === 'confirmed'
                        ? 'مؤكد'
                        : guest.responseStatus === 'declined'
                        ? 'معتذر'
                        : 'معلق'}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                    <span className="tabular-nums font-semibold text-neutral-700">
                      {guest.totalGroupMembers} أفراد ({guest.totalMales} ذكور، {guest.totalFemales} إناث)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveGuest(table.tableNumber, guest._id)}
                  className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                  title="إلغاء تسكين هذا الضيف من الطاولة"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Capacity Rule Enforcement badge */}
      <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
        <span>أقصى سعة: {table.maxCapacity} أشخاص</span>
        {isFull ? (
          <span className="text-rose-600 font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> لا يمكن إضافة المزيد
          </span>
        ) : (
          <span className="text-emerald-700 font-medium">
            تتسع لـ {table.remainingSeats} أفراد إضافيين
          </span>
        )}
      </div>
    </div>
  );
};
