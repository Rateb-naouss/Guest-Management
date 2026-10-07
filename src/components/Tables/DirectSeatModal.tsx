import React, { useState, useMemo } from 'react';
import { Table, Guest } from '../../types';
import { X, UserPlus, AlertCircle, CheckCircle2, Search } from 'lucide-react';

interface DirectSeatModalProps {
  isOpen: boolean;
  table: Table | null;
  allGuests: Guest[];
  onClose: () => void;
  onAssignGuest: (tableNumber: number, guestId: string) => Promise<void>;
}

export const DirectSeatModal: React.FC<DirectSeatModalProps> = ({
  isOpen,
  table,
  allGuests,
  onClose,
  onAssignGuest,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedGuestId(null);
    setErrorMsg(null);
    setSearch('');
  }, [isOpen, table]);

  // Filter unassigned or movable guests
  const eligibleGuests = useMemo(() => {
    if (!table) return [];
    let list = allGuests.filter((g) => g.tableNumber !== table.tableNumber);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.phoneNumber.includes(q)
      );
    }
    return list;
  }, [allGuests, table, search]);

  const selectedGuest = useMemo(() => {
    return allGuests.find((g) => g._id === selectedGuestId) || null;
  }, [allGuests, selectedGuestId]);

  const capacityCheck = useMemo(() => {
    if (!table || !selectedGuest) return { allowed: true };
    const remaining = table.remainingSeats;

    if (selectedGuest.totalGroupMembers > remaining) {
      return {
        allowed: false,
        message: `لا يمكن تعيين هذا الضيف إلى طاولة ${table.tableNumber}. سعة الطاولة ${table.maxCapacity} أشخاص والمتبقي فقط ${remaining} مقاعد.`,
      };
    }
    return { allowed: true };
  }, [table, selectedGuest]);

  if (!isOpen || !table) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestId || !selectedGuest) {
      setErrorMsg('يرجى اختيار ضيف للتسكين');
      return;
    }

    if (!capacityCheck.allowed) {
      setErrorMsg(capacityCheck.message || 'المقاعد المتبقية لا تكفي');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAssignGuest(table.tableNumber, selectedGuestId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في تسكين الضيف على الطاولة');
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
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                تسكين ضيف على {table.tableName || `طاولة ${table.tableNumber}`}
              </h2>
              <span className="text-xs text-neutral-500">
                المقاعد الشاغرة المتاحة: {table.remainingSeats} من أصل {table.maxCapacity} مقعد
              </span>
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

          {/* Search guest */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن اسم الضيف لتسكينه..."
              className="w-full pr-9 pl-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Guest selection list */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-2">
              اختر ضيفاً (يظهر حجم المجموعة والمقاعد المطلوبة):
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {eligibleGuests.length === 0 ? (
                <div className="p-4 text-center text-neutral-400">
                  لا يوجد ضيوف متاحين يطابقون البحث
                </div>
              ) : (
                eligibleGuests.map((guest) => {
                  const fits = guest.totalGroupMembers <= table.remainingSeats;
                  const isSelected = selectedGuestId === guest._id;

                  return (
                    <div
                      key={guest._id}
                      onClick={() => setSelectedGuestId(guest._id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600'
                          : fits
                          ? 'border-neutral-200 hover:border-neutral-300 bg-white'
                          : 'border-neutral-200 opacity-60 bg-neutral-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-neutral-900">{guest.fullName}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-neutral-700">
                            مجموعته: {guest.totalGroupMembers} أفراد
                          </span>
                          <span>·</span>
                          <span>
                            {guest.tableNumber ? `مسكن حالياً على طاولة ${guest.tableNumber}` : 'غير مسكن'}
                          </span>
                        </div>
                      </div>

                      <div>
                        {fits ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            تتسع ({guest.totalGroupMembers} مقاعد)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            تتجاوز السعة (متبقي {table.remainingSeats})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedGuest && !capacityCheck.allowed && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{capacityCheck.message}</span>
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
              disabled={isSubmitting || !selectedGuestId || !capacityCheck.allowed}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'جاري التسكين...' : 'تأكيد التسكين'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
