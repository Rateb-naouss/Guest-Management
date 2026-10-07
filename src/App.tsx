import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { api } from './services/api';
import { Guest, Table, DashboardStats, GuestFilters } from './types';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { TableOccupancyGrid } from './components/Dashboard/TableOccupancyGrid';
import { GenderAnalytics } from './components/Dashboard/GenderAnalytics';
import { GuestFiltersBar } from './components/Guests/GuestFilters';
import { GuestTable } from './components/Guests/GuestTable';
import { GuestModal } from './components/Guests/GuestModal';
import { AssignTableModal } from './components/Guests/AssignTableModal';
import { DeleteConfirmModal } from './components/Guests/DeleteConfirmModal';
import { TableManagement } from './components/Tables/TableManagement';
import { ExportModal } from './components/Export/ExportModal';
import { LoginForm } from './components/Auth/LoginForm';
import { GuestSideClassificationBar } from './components/Common/GuestSideClassificationBar';
import confetti from 'canvas-confetti';
import {
  Users,
  UtensilsCrossed,
  BarChart3,
  LayoutDashboard,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from 'lucide-react';

const initialFilters: GuestFilters = {
  search: '',
  gender: 'all',
  guestSide: 'all',
  invitationStatus: 'all',
  responseStatus: 'all',
  tableNumber: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

function MainApp() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { success, error, warning } = useToast();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'guests' | 'tables' | 'stats'>('dashboard');

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [allGuestsForTables, setAllGuestsForTables] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [totalGuestsCount, setTotalGuestsCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter State
  const [filters, setFilters] = useState<GuestFilters>(initialFilters);
  const [confirmedOnlyOccupancy, setConfirmedOnlyOccupancy] = useState<boolean>(false);

  // Loading States
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Modals
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [guestForTableAssign, setGuestForTableAssign] = useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [statsRes, guestsRes, tablesRes, allGuestsRes] = await Promise.all([
        api.getStats(confirmedOnlyOccupancy, filters.guestSide || 'all'),
        api.getGuests(filters),
        api.getTables(),
        api.getGuests({ limit: 1000 }), // unpaginated for table assignment lookups
      ]);

      setStats(statsRes.stats);
      setGuests(guestsRes.guests);
      setTotalGuestsCount(guestsRes.total);
      setTotalPages(guestsRes.totalPages);
      setTables(tablesRes.tables);
      setAllGuestsForTables(allGuestsRes.guests);
    } catch (err: any) {
      console.error('Failed to load wedding data:', err);
      error(err.message || 'حدث خطأ في تحميل البيانات من الخادم');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, filters, confirmedOnlyOccupancy, error]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">جاري التحقق من هوية المشرف...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Handlers for Guest Management
  const handleSaveGuest = async (guestData: any) => {
    try {
      if (guestToEdit) {
        await api.updateGuest(guestToEdit._id, guestData);
        success('تم تحديث بيانات الضيف بنجاح');
      } else {
        await api.createGuest(guestData);
        success('تمت إضافة الضيف بنجاح');
      }
      setIsGuestModalOpen(false);
      setGuestToEdit(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في حفظ الضيف');
      throw err;
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      await api.deleteGuest(guestId);
      success('تم حذف الضيف بنجاح');
      setGuestToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في حذف الضيف');
    }
  };

  const handleAssignTable = async (guestId: string, tableNumber: number | null) => {
    try {
      await api.assignTable(guestId, tableNumber);
      success(tableNumber !== null ? `تم تعيين الطاولة ${tableNumber} بنجاح` : 'تم إلغاء تعيين الطاولة');
      setGuestForTableAssign(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في تعيين الطاولة');
      throw err;
    }
  };

  const handleQuickUpdateInvitation = async (guest: Guest, status: 'invited' | 'not_invited') => {
    try {
      await api.updateInvitation(guest._id, status);
      success(`تم تغيير حالة الدعوة للضيف ${guest.fullName}`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في تحديث حالة الدعوة');
    }
  };

  const handleQuickUpdateResponse = async (
    guest: Guest,
    status: 'no_response' | 'confirmed' | 'declined'
  ) => {
    try {
      await api.updateResponse(guest._id, status);
      if (status === 'confirmed') {
        success(`تم تأكيد حضور ${guest.fullName} ومجموعته (${guest.totalGroupMembers} أفراد)`);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } else if (status === 'declined') {
        warning(`تم تسجيل اعتذار ${guest.fullName}`);
      } else {
        success(`تم تعديل حالة الرد للضيف ${guest.fullName}`);
      }
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في تحديث حالة الرد');
    }
  };

  // Handlers for Tables
  const handleAddTable = async (data: any) => {
    try {
      await api.createTable(data);
      success(`تم إنشاء طاولة رقم ${data.tableNumber} بنجاح`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في إنشاء الطاولة');
      throw err;
    }
  };

  const handleEditTable = async (tableNumber: number, data: any) => {
    try {
      await api.updateTable(tableNumber, data);
      success(`تم تحديث طاولة رقم ${tableNumber} بنجاح`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في تحديث الطاولة');
      throw err;
    }
  };

  const handleDeleteTable = async (tableNumber: number) => {
    try {
      await api.deleteTable(tableNumber);
      success(`تم حذف طاولة رقم ${tableNumber} بنجاح`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في حذف الطاولة');
    }
  };

  const handleRemoveGuestFromTable = async (tableNumber: number, guestId: string) => {
    try {
      await api.removeGuestFromTable(tableNumber, guestId);
      success('تم إلغاء تسكين الضيف من الطاولة بنجاح');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في إخلاء الضيف من الطاولة');
    }
  };

  const handleAssignGuestToTable = async (tableNumber: number, guestId: string) => {
    try {
      await api.assignGuestDirectlyToTable(tableNumber, guestId);
      success(`تم تسكين الضيف على طاولة ${tableNumber} بنجاح`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل في تسكين الضيف');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 text-neutral-900 pb-20">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddGuest={() => {
          setGuestToEdit(null);
          setIsGuestModalOpen(true);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onDataRefresh={loadData}
      />

      {/* Top Classification Bar: ضيوف العريس - ضيوف العروس */}
      <GuestSideClassificationBar
        currentSide={filters.guestSide || 'all'}
        onSelectSide={(side) => setFilters((prev) => ({ ...prev, guestSide: side, page: 1 }))}
        groomCount={stats?.groomGuestsCount}
        brideCount={stats?.brideGuestsCount}
        totalCount={(stats?.groomGuestsCount || 0) + (stats?.brideGuestsCount || 0)}
      />

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <StatsOverview
              stats={stats}
              confirmedOnly={confirmedOnlyOccupancy}
              onToggleConfirmedOnly={(val) => setConfirmedOnlyOccupancy(val)}
              onFilterByStatus={(st) => {
                setFilters((prev) => ({ ...prev, responseStatus: st, page: 1 }));
                setCurrentTab('guests');
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TableOccupancyGrid
                  occupancies={stats?.tableOccupancies || []}
                  confirmedOnly={confirmedOnlyOccupancy}
                  onSelectTable={(tableNumber) => {
                    setFilters((prev) => ({ ...prev, tableNumber, page: 1 }));
                    setCurrentTab('guests');
                  }}
                />
              </div>

              <div>
                <GenderAnalytics stats={stats} />
              </div>
            </div>
          </div>
        )}

        {/* Guests List Tab */}
        {currentTab === 'guests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-neutral-900">سجل وبطاقات ضيوف الزفاف</h1>
                <p className="text-xs text-neutral-500">
                  إدارة بيانات المدعوين، أعداد العائلة، الحساب الآلي للمجاميع وتعيين مقاعد الطاولات
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>

                <button
                  onClick={() => {
                    setGuestToEdit(null);
                    setIsGuestModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة ضيف جديد</span>
                </button>
              </div>
            </div>

            <GuestFiltersBar
              filters={filters}
              tables={tables}
              onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
              onReset={() => setFilters(initialFilters)}
            />

            <GuestTable
              guests={guests}
              total={totalGuestsCount}
              page={filters.page}
              totalPages={totalPages}
              limit={filters.limit}
              tables={tables}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setFilters((prev) => ({ ...prev, limit: l, page: 1 }))}
              onEdit={(g) => {
                setGuestToEdit(g);
                setIsGuestModalOpen(true);
              }}
              onDelete={(g) => setGuestToDelete(g)}
              onAssignTable={(g) => setGuestForTableAssign(g)}
              onQuickUpdateInvitation={handleQuickUpdateInvitation}
              onQuickUpdateResponse={handleQuickUpdateResponse}
            />
          </div>
        )}

        {/* Tables Tab */}
        {currentTab === 'tables' && (
          <TableManagement
            tables={tables}
            allGuests={allGuestsForTables}
            onAddTable={handleAddTable}
            onEditTable={handleEditTable}
            onDeleteTable={handleDeleteTable}
            onRemoveGuestFromTable={handleRemoveGuestFromTable}
            onAssignGuestToTable={handleAssignGuestToTable}
          />
        )}

        {/* In-depth Analytics & Stats Tab */}
        {currentTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">إحصائيات الرجال والنساء</h2>
                  <p className="text-xs text-neutral-500">
                    أرقام دقيقة محسوبة آلياً من قاعدة البيانات لتجهيز بوفيه الطعام وتوزيع قاعات الرجال والنساء
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تحميل تقرير إحصائي مفصل (.xlsx)</span>
              </button>
            </div>

            <GenderAnalytics stats={stats} />

            <StatsOverview
              stats={stats}
              confirmedOnly={confirmedOnlyOccupancy}
              onToggleConfirmedOnly={(val) => setConfirmedOnlyOccupancy(val)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <GuestModal
        isOpen={isGuestModalOpen}
        guestToEdit={guestToEdit}
        tables={tables}
        defaultGuestSide={filters.guestSide === 'bride' ? 'bride' : 'groom'}
        onClose={() => {
          setIsGuestModalOpen(false);
          setGuestToEdit(null);
        }}
        onSubmit={handleSaveGuest}
      />

      <AssignTableModal
        isOpen={!!guestForTableAssign}
        guest={guestForTableAssign}
        tables={tables}
        onClose={() => setGuestForTableAssign(null)}
        onAssign={handleAssignTable}
      />

      <DeleteConfirmModal
        isOpen={!!guestToDelete}
        guest={guestToDelete}
        onClose={() => setGuestToDelete(null)}
        onConfirm={handleDeleteGuest}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
