import React, { useState } from 'react';
import { Guest } from '../../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  guest: Guest | null;
  onClose: () => void;
  onConfirm: (guestId: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  guest,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !guest) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(guest._id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-neutral-900 mb-2">
            تأكيد حذف بطاقة الضيف
          </h3>

          <p className="text-xs text-neutral-600 leading-relaxed mb-4">
            هل أنت متأكد من رغبتك في حذف الضيف{' '}
            <strong className="text-neutral-900">"{guest.fullName}"</strong>؟
            {guest.totalGroupMembers > 1 && (
              <span className="block mt-1 text-amber-700 font-semibold">
                تنبيه: سيؤدي الحذف إلى إزالة مجموعته بالكامل ({guest.totalGroupMembers} أفراد) وتفريغ مقاعدهم من الطاولة.
              </span>
            )}
          </p>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 mb-6 text-right space-y-1">
            <div className="flex justify-between">
              <span>رقم الهاتف:</span>
              <span className="font-mono text-neutral-900" dir="ltr">{guest.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>الطاولة المعين عليها:</span>
              <span className="font-bold text-neutral-900">
                {guest.tableNumber ? `طاولة ${guest.tableNumber}` : 'غير مسكن'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-200"
            >
              إلغاء التراجع
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-1/2 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
            >
              {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
