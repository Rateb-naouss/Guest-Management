import React, { useState, useEffect } from 'react';
import { Table } from '../../types';
import { X, UtensilsCrossed, AlertCircle } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  tableToEdit: Table | null;
  existingTableNumbers: number[];
  onClose: () => void;
  onSubmit: (data: {
    tableNumber: number;
    tableName?: string;
    maxCapacity: number;
    notes?: string;
  }) => Promise<void>;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  tableToEdit,
  existingTableNumbers,
  onClose,
  onSubmit,
}) => {
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [tableName, setTableName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tableToEdit) {
      setTableNumber(tableToEdit.tableNumber);
      setTableName(tableToEdit.tableName || '');
      setMaxCapacity(tableToEdit.maxCapacity);
      setNotes(tableToEdit.notes || '');
    } else {
      // Find next available table number
      const nextNum = existingTableNumbers.length > 0
        ? Math.max(...existingTableNumbers) + 1
        : 1;
      setTableNumber(nextNum);
      setTableName(`طاولة رقم ${nextNum}`);
      setMaxCapacity(10); // Default 10
      setNotes('');
    }
    setErrorMsg(null);
  }, [tableToEdit, existingTableNumbers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const num = Number(tableNumber);
    const cap = Number(maxCapacity);

    if (num < 1 || !Number.isInteger(num)) {
      setErrorMsg('رقم الطاولة يجب أن يكون رقماً صحيحاً أكبر من الصفر');
      return;
    }

    if (cap < 1 || !Number.isInteger(cap)) {
      setErrorMsg('سعة الطاولة يجب أن تكون مقعداً واحداً على الأقل');
      return;
    }

    if (!tableToEdit && existingTableNumbers.includes(num)) {
      setErrorMsg(`طاولة رقم ${num} موجودة بالفعل، اختر رقماً آخر`);
      return;
    }

    if (tableToEdit && cap < tableToEdit.currentPeople) {
      setErrorMsg(
        `لا يمكن تقليل سعة الطاولة إلى ${cap} لأنها تضم حالياً ${tableToEdit.currentPeople} فرداً مسكناً.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        tableNumber: num,
        tableName: tableName.trim() || `طاولة رقم ${num}`,
        maxCapacity: cap,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في حفظ بيانات الطاولة');
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
              <h2 className="text-base font-bold text-neutral-900">
                {tableToEdit ? `تعديل طاولة رقم ${tableToEdit.tableNumber}` : 'إضافة طاولة زفاف جديدة'}
              </h2>
              <span className="text-xs text-neutral-500">السعة الافتراضية 10 أشخاص لكل طاولة</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                رقم الطاولة <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={!!tableToEdit}
                value={tableNumber}
                onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 disabled:opacity-60 tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                أقصى سعة استيعابية <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 tabular-nums"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                الافتراضي 10 مقاعد
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              اسم أو وصف الطاولة (اختياري)
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="مثال: طاولة أهل العريس..."
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              ملاحظات الموقع أو التنظيم
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="..."
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-neutral-400"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'جاري الحفظ...' : tableToEdit ? 'حفظ التعديلات' : 'إنشاء الطاولة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
