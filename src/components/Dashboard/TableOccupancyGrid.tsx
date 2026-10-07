import React from 'react';
import { TableOccupancy } from '../../types';
import { UtensilsCrossed, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface TableOccupancyGridProps {
  occupancies: TableOccupancy[];
  confirmedOnly: boolean;
  onSelectTable?: (tableNumber: number) => void;
}

export const TableOccupancyGrid: React.FC<TableOccupancyGridProps> = ({
  occupancies,
  confirmedOnly,
  onSelectTable,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-neutral-900">
              نسبة إشغال طاولات الحفل ({confirmedOnly ? 'بناءً على المؤكدين' : 'بناءً على جميع المعينين'})
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            سعة كل طاولة الافتراضية 10 أشخاص مع إمكانية تعديل السعة وإظهار المقاعد الشاغرة
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 inline-block" />
            <span>فارغة</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>متاحة</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>شبه ممتلئة</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>ممتلئة بالكامل</span>
          </div>
        </div>
      </div>

      {occupancies.length === 0 ? (
        <div className="text-center py-10 text-neutral-500 text-sm">
          لم يتم إنشاء أي طاولات بعد
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {occupancies.map((table) => {
            const isFull = table.currentPeople >= table.maxCapacity;
            const isEmpty = table.currentPeople === 0;
            const isAlmostFull = !isFull && table.remainingSeats <= 2 && table.currentPeople > 0;

            const progressBg = isFull
              ? 'bg-rose-500'
              : isAlmostFull
              ? 'bg-amber-500'
              : isEmpty
              ? 'bg-neutral-200'
              : 'bg-emerald-500';

            const borderClass = isFull
              ? 'border-rose-200 hover:border-rose-300'
              : isAlmostFull
              ? 'border-amber-200 hover:border-amber-300'
              : 'border-neutral-200 hover:border-neutral-300';

            return (
              <div
                key={table.tableNumber}
                onClick={() => onSelectTable?.(table.tableNumber)}
                className={`p-4 rounded-xl border ${borderClass} bg-white shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-900 font-sans">
                      {table.tableName || `طاولة ${table.tableNumber}`}
                    </span>
                    <span
                      className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                        isFull
                          ? 'bg-rose-50 text-rose-700'
                          : isAlmostFull
                          ? 'bg-amber-50 text-amber-700'
                          : isEmpty
                          ? 'bg-neutral-100 text-neutral-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {table.currentPeople} / {table.maxCapacity}
                    </span>
                  </div>

                  {/* Occupancy text label as explicitly requested: Table 1 — 8 / 10 */}
                  <div className="mt-1 text-xs text-neutral-500 font-medium">
                    طاولة {table.tableNumber} — <span className="tabular-nums font-bold text-neutral-800">{table.currentPeople}</span> / <span className="tabular-nums">{table.maxCapacity}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
                      style={{ width: `${Math.min(100, (table.currentPeople / table.maxCapacity) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{table.assignedGuestsCount} عائلات</span>
                  </div>

                  {isFull ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> ممتلئة
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium tabular-nums">
                      متبقي {table.remainingSeats} مقاعد
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
