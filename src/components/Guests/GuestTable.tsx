import React from 'react';
import { Guest, Table } from '../../types';
import {
  Edit3,
  Trash2,
  UtensilsCrossed,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  MailCheck,
  MailQuestion,
  UserCheck,
} from 'lucide-react';

interface GuestTableProps {
  guests: Guest[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  tables: Table[];
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onAssignTable: (guest: Guest) => void;
  onQuickUpdateInvitation: (guest: Guest, status: 'invited' | 'not_invited') => void;
  onQuickUpdateResponse: (guest: Guest, status: 'no_response' | 'confirmed' | 'declined') => void;
}

export const GuestTable: React.FC<GuestTableProps> = ({
  guests,
  total,
  page,
  totalPages,
  limit,
  tables,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onAssignTable,
  onQuickUpdateInvitation,
  onQuickUpdateResponse,
}) => {
  const getTableInfo = (tableNumber: number | null) => {
    if (tableNumber === null || tableNumber === undefined) return null;
    return tables.find((t) => t.tableNumber === tableNumber);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
      {/* Table responsive scroll wrapper */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-right text-xs">
          <thead className="bg-neutral-50/90 text-neutral-600 font-semibold border-b border-neutral-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="py-3.5 px-4">
                الاسم
              </th>
              <th scope="col" className="py-3.5 px-3">
                الهاتف
              </th>
              <th scope="col" className="py-3.5 px-3">
                الجنس
              </th>
              <th scope="col" className="py-3.5 px-3 text-center">
                الذكور
              </th>
              <th scope="col" className="py-3.5 px-3 text-center">
                الإناث
              </th>
              <th scope="col" className="py-3.5 px-3 text-center">
                المجموع
              </th>
              <th scope="col" className="py-3.5 px-3">
                الدعوة
              </th>
              <th scope="col" className="py-3.5 px-3">
                الرد
              </th>
              <th scope="col" className="py-3.5 px-3">
                الطاولة
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-800">
            {guests.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-14 text-center text-neutral-400 text-sm">
                  لا توجد سجلات ضيوف تطابق شروط البحث أو الفلاتر المحددة
                </td>
              </tr>
            ) : (
              guests.map((guest) => {
                const tableInfo = getTableInfo(guest.tableNumber);

                return (
                  <tr
                    key={guest._id}
                    className="hover:bg-amber-50/30 transition-colors group"
                  >
                    {/* Name & Notes */}
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-neutral-900">{guest.fullName}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              guest.guestSide === 'bride'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {guest.guestSide === 'bride' ? '👰 العروس' : '🤵 العريس'}
                          </span>
                        </div>
                        {guest.notes && (
                          <span className="text-[11px] text-neutral-400 font-normal truncate max-w-[200px]" title={guest.notes}>
                            {guest.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-3 font-mono text-neutral-600 tabular-nums">
                      <a
                        href={`tel:${guest.phoneNumber}`}
                        className="hover:text-amber-800 flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span dir="ltr">{guest.phoneNumber}</span>
                      </a>
                    </td>

                    {/* Gender */}
                    <td className="py-3.5 px-3 font-medium">
                      {guest.gender === 'male' ? (
                        <span className="text-blue-700">ذكر</span>
                      ) : (
                        <span className="text-pink-700">أنثى</span>
                      )}
                    </td>

                    {/* Males in group */}
                    <td className="py-3.5 px-3 text-center tabular-nums font-semibold text-neutral-700">
                      {guest.totalMales}
                      {guest.maleFamilyMembers > 0 && (
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          (+{guest.maleFamilyMembers} مرافق)
                        </span>
                      )}
                    </td>

                    {/* Females in group */}
                    <td className="py-3.5 px-3 text-center tabular-nums font-semibold text-neutral-700">
                      {guest.totalFemales}
                      {guest.femaleFamilyMembers > 0 && (
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          (+{guest.femaleFamilyMembers} مرافقة)
                        </span>
                      )}
                    </td>

                    {/* Total Group Members */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200/70 px-2 py-0.5 rounded-lg tabular-nums">
                        {guest.totalGroupMembers} أفراد
                      </span>
                    </td>

                    {/* Invitation Status (Interactive Toggle) */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() =>
                          onQuickUpdateInvitation(
                            guest,
                            guest.invitationStatus === 'invited' ? 'not_invited' : 'invited'
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          guest.invitationStatus === 'invited'
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                        title="انقر لتغيير حالة الدعوة"
                      >
                        {guest.invitationStatus === 'invited' ? (
                          <>
                            <MailCheck className="w-3 h-3 text-emerald-600" />
                            <span>تمت الدعوة</span>
                          </>
                        ) : (
                          <>
                            <MailQuestion className="w-3 h-3 text-neutral-400" />
                            <span>لم تُرسل</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Response Status (Interactive Switcher) */}
                    <td className="py-3.5 px-3">
                      <div className="relative inline-block">
                        <select
                          value={guest.responseStatus}
                          onChange={(e) =>
                            onQuickUpdateResponse(guest, e.target.value as any)
                          }
                          className={`appearance-none py-1 pr-6 pl-2 rounded-md text-[11px] font-semibold border cursor-pointer focus:outline-hidden transition-colors ${
                            guest.responseStatus === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : guest.responseStatus === 'declined'
                              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <option value="confirmed">✓ مؤكد</option>
                          <option value="declined">✕ معتذر</option>
                          <option value="no_response">○ بانتظار الرد</option>
                        </select>
                      </div>
                    </td>

                    {/* Table Assignment */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => onAssignTable(guest)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          guest.tableNumber !== null
                            ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200'
                            : 'bg-neutral-50 text-amber-800 border border-dashed border-amber-300 hover:bg-amber-50'
                        }`}
                        title="انقر لتغيير أو تعيين الطاولة"
                      >
                        <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                        {guest.tableNumber !== null ? (
                          <span>طاولة {guest.tableNumber}</span>
                        ) : (
                          <span className="text-amber-800">+ تعيين طاولة</span>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(guest)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="تعديل بيانات الضيف"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(guest)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف الضيف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-3">
          <span>
            إجمالي السجلات: <strong className="text-neutral-900 tabular-nums">{total}</strong> ضيف
          </span>
          <div className="flex items-center gap-1">
            <span>عرض:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="py-1 px-2 bg-white border border-neutral-200 rounded-md font-medium text-neutral-800"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="tabular-nums px-2">
            صفحة <strong className="text-neutral-900">{page}</strong> من <strong className="text-neutral-900">{totalPages}</strong>
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
