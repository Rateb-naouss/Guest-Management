import React, { useState } from 'react';
import { Table, Guest } from '../../types';
import { TableCard } from './TableCard';
import { TableModal } from './TableModal';
import { DirectSeatModal } from './DirectSeatModal';
import { UtensilsCrossed, Plus, Search, Layers, Armchair } from 'lucide-react';

interface TableManagementProps {
  tables: Table[];
  allGuests: Guest[];
  onAddTable: (data: {
    tableNumber: number;
    tableName?: string;
    maxCapacity: number;
    notes?: string;
  }) => Promise<void>;
  onEditTable: (
    tableNumber: number,
    data: {
      tableName?: string;
      maxCapacity?: number;
      notes?: string;
    }
  ) => Promise<void>;
  onDeleteTable: (tableNumber: number) => Promise<void>;
  onRemoveGuestFromTable: (tableNumber: number, guestId: string) => Promise<void>;
  onAssignGuestToTable: (tableNumber: number, guestId: string) => Promise<void>;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  tables,
  allGuests,
  onAddTable,
  onEditTable,
  onDeleteTable,
  onRemoveGuestFromTable,
  onAssignGuestToTable,
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [tableForDirectSeat, setTableForDirectSeat] = useState<Table | null>(null);

  const filteredTables = tables.filter((t) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      t.tableNumber.toString().includes(q) ||
      (t.tableName && t.tableName.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.assignedGuests.some((g) => g.fullName.toLowerCase().includes(q))
    );
  });

  const totalCapacity = tables.reduce((acc, t) => acc + t.maxCapacity, 0);
  const totalOccupied = tables.reduce((acc, t) => acc + t.currentPeople, 0);
  const totalRemaining = Math.max(0, totalCapacity - totalOccupied);

  const existingNumbers = tables.map((t) => t.tableNumber);

  return (
    <div className="space-y-6">
      {/* Header controls banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">إدارة وتوزيع طاولات الزفاف</h2>
            <p className="text-xs text-neutral-500">
              تطبيق قواعد السعة الصارمة (10 مقاعد افتراضياً لكل طاولة) ومنع تجاوز السعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setTableToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طاولة جديدة</span>
          </button>
        </div>
      </div>

      {/* Hall summary stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">عدد الطاولات الإجمالي</span>
            <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-0.5">
              {tables.length} <span className="text-xs text-neutral-400 font-normal">طاولة</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">سعة مقاعد القاعة</span>
            <div className="text-2xl font-bold text-neutral-900 tabular-nums mt-0.5">
              {totalCapacity} <span className="text-xs text-neutral-400 font-normal">مقعداً</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <Armchair className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">المقاعد الشاغرة المتاحة</span>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
              {totalRemaining} <span className="text-xs text-emerald-600 font-normal">مقعد متاح</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="text-xs font-bold tabular-nums">
              {totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0}% إشغال
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar for Tables */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الطاولة أو اسمها أو باسم ضيف مسكن عليها..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 shadow-xs"
        />
      </div>

      {/* Grid of Tables */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
          لا توجد طاولات تطابق البحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTables.map((table) => (
            <TableCard
              key={table.tableNumber}
              table={table}
              onEditTable={(t) => {
                setTableToEdit(t);
                setIsAddModalOpen(true);
              }}
              onDeleteTable={(t) => {
                if (
                  window.confirm(
                    `هل أنت متأكد من حذف طاولة رقم ${t.tableNumber}؟ سيتم إلغاء تسكين أي ضيوف مسكنين عليها.`
                  )
                ) {
                  onDeleteTable(t.tableNumber);
                }
              }}
              onRemoveGuest={(tNum, gId) => onRemoveGuestFromTable(tNum, gId)}
              onAssignGuestClick={(t) => setTableForDirectSeat(t)}
            />
          ))}
        </div>
      )}

      {/* Table Add / Edit Modal */}
      <TableModal
        isOpen={isAddModalOpen}
        tableToEdit={tableToEdit}
        existingTableNumbers={existingNumbers}
        onClose={() => {
          setIsAddModalOpen(false);
          setTableToEdit(null);
        }}
        onSubmit={async (data) => {
          if (tableToEdit) {
            await onEditTable(tableToEdit.tableNumber, data);
          } else {
            await onAddTable(data);
          }
        }}
      />

      {/* Direct Seat Modal */}
      <DirectSeatModal
        isOpen={!!tableForDirectSeat}
        table={tableForDirectSeat}
        allGuests={allGuests}
        onClose={() => setTableForDirectSeat(null)}
        onAssignGuest={onAssignGuestToTable}
      />
    </div>
  );
};
