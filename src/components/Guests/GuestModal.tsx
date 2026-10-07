import React, { useState, useEffect, useMemo } from 'react';
import { Guest, Table, Gender, GuestSide, InvitationStatus, ResponseStatus } from '../../types';
import { X, Users, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface GuestModalProps {
  isOpen: boolean;
  guestToEdit: Guest | null;
  tables: Table[];
  defaultGuestSide?: GuestSide;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    phoneNumber: string;
    gender: Gender;
    guestSide: GuestSide;
    maleFamilyMembers: number;
    femaleFamilyMembers: number;
    invitationStatus: InvitationStatus;
    responseStatus: ResponseStatus;
    tableNumber: number | null;
    notes?: string;
  }) => Promise<void>;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  guestToEdit,
  tables,
  defaultGuestSide = 'groom',
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [guestSide, setGuestSide] = useState<GuestSide>('groom');
  const [maleFamilyMembers, setMaleFamilyMembers] = useState<number>(0);
  const [femaleFamilyMembers, setFemaleFamilyMembers] = useState<number>(0);
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>('invited');
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>('no_response');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (guestToEdit) {
      setFullName(guestToEdit.fullName);
      setPhoneNumber(guestToEdit.phoneNumber);
      setGender(guestToEdit.gender);
      setGuestSide(guestToEdit.guestSide || 'groom');
      setMaleFamilyMembers(guestToEdit.maleFamilyMembers);
      setFemaleFamilyMembers(guestToEdit.femaleFamilyMembers);
      setInvitationStatus(guestToEdit.invitationStatus);
      setResponseStatus(guestToEdit.responseStatus);
      setTableNumber(guestToEdit.tableNumber);
      setNotes(guestToEdit.notes || '');
    } else {
      setFullName('');
      setPhoneNumber('');
      setGender('male');
      setGuestSide(defaultGuestSide);
      setMaleFamilyMembers(0);
      setFemaleFamilyMembers(0);
      setInvitationStatus('invited');
      setResponseStatus('no_response');
      setTableNumber(null);
      setNotes('');
    }
    setFormError(null);
  }, [guestToEdit, defaultGuestSide, isOpen]);

  // Automatic Calculation of Total Group Members: Male Members + Female Members + Main Guest (1)
  const totalGroupMembers = useMemo(() => {
    const m = Math.max(0, Number(maleFamilyMembers) || 0);
    const f = Math.max(0, Number(femaleFamilyMembers) || 0);
    return m + f + 1;
  }, [maleFamilyMembers, femaleFamilyMembers]);

  // Gender breakdown
  const groupMales = useMemo(() => {
    const m = Math.max(0, Number(maleFamilyMembers) || 0);
    return m + (gender === 'male' ? 1 : 0);
  }, [maleFamilyMembers, gender]);

  const groupFemales = useMemo(() => {
    const f = Math.max(0, Number(femaleFamilyMembers) || 0);
    return f + (gender === 'female' ? 1 : 0);
  }, [femaleFamilyMembers, gender]);

  // Real-time Table Capacity Validation on Frontend
  const capacityError = useMemo(() => {
    if (tableNumber === null || tableNumber === undefined) return null;
    const targetTable = tables.find((t) => t.tableNumber === tableNumber);
    if (!targetTable) return null;

    let currentOccupancy = targetTable.currentPeople;
    // If editing guest and currently seated at this table, subtract previous group
    if (guestToEdit && guestToEdit.tableNumber === tableNumber) {
      currentOccupancy = Math.max(0, currentOccupancy - guestToEdit.totalGroupMembers);
    }

    const remainingSeats = Math.max(0, targetTable.maxCapacity - currentOccupancy);

    if (currentOccupancy + totalGroupMembers > targetTable.maxCapacity) {
      return `لا يمكن تعيين هذا الضيف إلى طاولة ${tableNumber}. سعة الطاولة ${targetTable.maxCapacity} أشخاص والمتبقي فقط ${remainingSeats} مقاعد.`;
    }
    return null;
  }, [tableNumber, tables, totalGroupMembers, guestToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('الاسم الكامل مطلوب ويجب ألا يقل عن حرفين');
      return;
    }

    if (!phoneNumber.trim()) {
      setFormError('رقم الهاتف مطلوب');
      return;
    }

    if (maleFamilyMembers < 0 || femaleFamilyMembers < 0) {
      setFormError('لا يمكن إدخال أرقام سالبة لأفراد العائلة');
      return;
    }

    // Capacity block
    if (capacityError) {
      setFormError(capacityError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        gender,
        guestSide,
        maleFamilyMembers: Math.max(0, Math.floor(Number(maleFamilyMembers) || 0)),
        femaleFamilyMembers: Math.max(0, Math.floor(Number(femaleFamilyMembers) || 0)),
        invitationStatus,
        responseStatus,
        tableNumber,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'فشل في حفظ بيانات الضيف');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {guestToEdit ? 'تعديل بيانات الضيف' : 'إضافة ضيف جديد لحفل الزفاف'}
              </h2>
              <span className="text-xs text-neutral-500">حساب أفراد المجموعة وتدقيق سعة الطاولة آلياً</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                الاسم الكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: د. عبدالرحمن آل سعود"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="مثال: 0501234567"
                dir="ltr"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-right"
              />
            </div>
          </div>

          {/* Guest Side (Groom vs Bride) */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              تصنيف الضيف (طرف الدعوة) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGuestSide('groom')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  guestSide === 'groom'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span>🤵</span>
                <span>ضيوف العريس</span>
              </button>

              <button
                type="button"
                onClick={() => setGuestSide('bride')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  guestSide === 'bride'
                    ? 'bg-pink-600 border-pink-600 text-white shadow-sm'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span>👰</span>
                <span>ضيوف العروس</span>
              </button>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              جنس الضيف الرئيسي <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>ذكر (الضيف الرئيسي)</span>
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  gender === 'female'
                    ? 'bg-pink-50 border-pink-400 text-pink-800 shadow-xs'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>أنثى (الضيفة الرئيسية)</span>
              </button>
            </div>
          </div>

          {/* Family Members Numbers (Strict Non-Negative Prevention) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                أفراد العائلة المرافقين (ذكور)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={maleFamilyMembers}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setMaleFamilyMembers(val);
                }}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                مرافقين من غير الضيف الرئيسي
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                أفراد العائلة المرافقين (إناث)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={femaleFamilyMembers}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setFemaleFamilyMembers(val);
                }}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                مرافقات من غير الضيفة الرئيسية
              </span>
            </div>
          </div>

          {/* Automatic Calculation Card Display */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>إجمالي أفراد مجموعة الضيف المحسوب آلياً:</span>
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                {maleFamilyMembers} ذكور + {femaleFamilyMembers} إناث + 1 الضيف الأساسي ={' '}
                <strong className="text-amber-950 font-bold">{totalGroupMembers} أفراد</strong> ({groupMales} ذكور، {groupFemales} إناث)
              </div>
            </div>
            <div className="text-xl font-extrabold tabular-nums bg-white px-3 py-1 rounded-lg border border-amber-300 text-amber-900">
              {totalGroupMembers}
            </div>
          </div>

          {/* Invitation and Response Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                حالة إرسال الدعوة
              </label>
              <select
                value={invitationStatus}
                onChange={(e) => setInvitationStatus(e.target.value as InvitationStatus)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="invited">تم إرسال الدعوة</option>
                <option value="not_invited">لم ترسل بعد (قائمة الانتظار)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                حالة رد الضيف
              </label>
              <select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value as ResponseStatus)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="no_response">بانتظار الرد (معلق)</option>
                <option value="confirmed">مؤكد الحضور</option>
                <option value="declined">معتذر عن الحضور</option>
              </select>
            </div>
          </div>

          {/* Table Assignment with Live Capacity Check */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              تعيين طاولة الجلوس
            </label>
            <select
              value={tableNumber !== null ? tableNumber : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                setTableNumber(val);
              }}
              className={`w-full px-3 py-2 bg-neutral-50 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                capacityError
                  ? 'border-rose-300 ring-rose-200 text-rose-900 bg-rose-50/40'
                  : 'border-neutral-200 focus:ring-amber-500/20 focus:border-amber-600'
              }`}
            >
              <option value="">-- غير مسكن على طاولة --</option>
              {tables.map((t) => {
                let current = t.currentPeople;
                if (guestToEdit && guestToEdit.tableNumber === t.tableNumber) {
                  current = Math.max(0, current - guestToEdit.totalGroupMembers);
                }
                const remaining = Math.max(0, t.maxCapacity - current);
                const willExceed = current + totalGroupMembers > t.maxCapacity;

                return (
                  <option
                    key={t.tableNumber}
                    value={t.tableNumber}
                    disabled={willExceed}
                  >
                    {t.tableName || `طاولة ${t.tableNumber}`} — (سعة {t.maxCapacity} | مسكن {current} | متبقي {remaining} مقاعد)
                    {willExceed ? ' ✕ لا تتسع' : ''}
                  </option>
                );
              })}
            </select>

            {/* Live capacity warning banner */}
            {capacityError ? (
              <p className="mt-1.5 text-xs text-rose-700 font-semibold flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{capacityError}</span>
              </p>
            ) : tableNumber !== null ? (
              <p className="mt-1.5 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>تتسع الطاولة لمجموعة الضيف بالكامل ({totalGroupMembers} مقاعد)</span>
              </p>
            ) : null}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: قريب العريس، كرسي للأطفال، وجبة خاصة..."
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* Footer buttons */}
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
              disabled={isSubmitting || !!capacityError}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'جاري الحفظ...' : guestToEdit ? 'حفظ التعديلات' : 'إضافة الضيف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
