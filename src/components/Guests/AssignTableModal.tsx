import React, { useState, useMemo } from 'react';
import { Guest, Table } from '../../types';
import { X, UtensilsCrossed, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AssignTableModalProps {
  isOpen: boolean;
  guest: Guest | null;
  tables: Table[];
  onClose: () => void;
  onAssign: (guestId: string, tableNumber: number | null) => Promise<void>;
}

export const AssignTableModal: React.FC<AssignTableModalProps> = ({
  isOpen,
  guest,
  tables,
  onClose,
  onAssign,
}) => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (guest) {
      setSelectedTable(guest.tableNumber);
    }
    setErrorMessage(null);
  }, [guest, isOpen]);

  const capacityValidation = useMemo(() => {
    if (!guest || selectedTable === null) return { allowed: true };
    const table = tables.find((t) => t.tableNumber === selectedTable);
    if (!table) return { allowed: true };

    let currentOccupancy = table.currentPeople;
    if (guest.tableNumber === selectedTable) {
      currentOccupancy = Math.max(0, currentOccupancy - guest.totalGroupMembers);
    }

    const remaining = Math.max(0, table.maxCapacity - currentOccupancy);
    if (currentOccupancy + guest.totalGroupMembers > table.maxCapacity) {
      return {
        allowed: false,
        message: `لا يمكن تعيين هذا الضيف إلى طاولة ${selectedTable}. سعة الطاولة ${table.maxCapacity} أشخاص والمتبقي فقط ${remaining} مقاعد.`,
        remaining,
        maxCapacity: table.maxCapacity,
      };
    }

    return { allowed: true, remaining, maxCapacity: table.maxCapacity };
  }, [guest, selectedTable, tables]);

  if (!isOpen || !guest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capacityValidation.allowed) {
      setErrorMessage(capacityValidation.message || 'السعة لا تكفي');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onAssign(guest._id, selectedTable);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في تعيين الطاولة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">تعيين أو نقل طاولة الضيف</h2>
              <span className="text-xs text-neutral-500 font-medium">{guest.fullName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Group details pill */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
            <span className="text-neutral-600">إجمالي مقاعد المجموعة المطلوبة:</span>
            <span className="font-bold text-neutral-900 tabular-nums px-2 py-0.5 bg-white border border-neutral-200 rounded-md">
              {guest.totalGroupMembers} مقاعد
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-neutral-700 mb-2">
              اختر الطاولة المناسبة:
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTable === null
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableSelection"
                    checked={selectedTable === null}
                    onChange={() => setSelectedTable(null)}
                    className="accent-neutral-900"
                  />
                  <span className="font-medium text-neutral-800">إلغاء التعيين (غير مسكن)</span>
                </div>
              </label>

              {tables.map((t) => {
                let current = t.currentPeople;
                if (guest.tableNumber === t.tableNumber) {
                  current = Math.max(0, current - guest.totalGroupMembers);
                }
                const remaining = Math.max(0, t.maxCapacity - current);
                const willExceed = current + guest.totalGroupMembers > t.maxCapacity;

                return (
                  <label
                    key={t.tableNumber}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      willExceed
                        ? 'opacity-60 bg-rose-50/20 border-neutral-200 cursor-not-allowed'
                        : selectedTable === t.tableNumber
                        ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-600 cursor-pointer'
                        : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tableSelection"
                        disabled={willExceed}
                        checked={selectedTable === t.tableNumber}
                        onChange={() => setSelectedTable(t.tableNumber)}
                        className="accent-amber-600"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block font-sans">
                          {t.tableName || `طاولة ${t.tableNumber}`}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          مشغول: {current} / {t.maxCapacity} مقعد
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      {willExceed ? (
                        <span className="text-[11px] font-bold text-rose-600">
                          غير كافية (متبقي {remaining})
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          متاح {remaining} مقاعد
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {!capacityValidation.allowed && capacityValidation.message && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{capacityValidation.message}</span>
            </div>
          )}

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !capacityValidation.allowed}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تثبيت التعيين'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
