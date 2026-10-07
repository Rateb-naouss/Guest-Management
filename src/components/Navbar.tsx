import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Users,
  LayoutDashboard,
  UtensilsCrossed,
  BarChart3,
  FileSpreadsheet,
  UserPlus,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'guests' | 'tables' | 'stats';
  onSelectTab: (tab: 'dashboard' | 'guests' | 'tables' | 'stats') => void;
  onOpenAddGuest: () => void;
  onOpenExport: () => void;
  onDataRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddGuest,
  onOpenExport,
  onDataRefresh,
}) => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [isResetting, setIsResetting] = React.useState(false);

  const handleReset = async () => {
    if (!window.confirm('هل تريد استعادة البيانات النموذجية الأولية لحفل الزفاف؟')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemoData();
      success('تمت استعادة البيانات النموذجية بنجاح');
      onDataRefresh();
    } catch (err: any) {
      error(err.message || 'فشل في استعادة البيانات');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-bold tracking-tight text-neutral-900 block font-serif sm:font-sans">
                منظّم ضيوف الزفاف
              </span>
              <span className="text-xs text-neutral-500 font-medium">Wedding Guest Manager</span>
            </div>
          </div>

          {/* Zone 2: Navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة التحكم</span>
            </button>

            <button
              onClick={() => onSelectTab('guests')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'guests'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الضيوف</span>
            </button>

            <button
              onClick={() => onSelectTab('tables')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'tables'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>إدارة الطاولات</span>
            </button>

            <button
              onClick={() => onSelectTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'stats'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>إحصائيات الرجال والنساء</span>
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
              title="تصدير بيانات الضيوف والتقارير إلى Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>

            <button
              onClick={onOpenAddGuest}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة ضيف</span>
            </button>

            <div className="h-6 w-px bg-neutral-200 hidden sm:block" />

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                disabled={isResetting}
                title="إعادة تعيين البيانات النموذجية"
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={logout}
                title={`تسجيل الخروج (${user?.name || 'المشرف'})`}
                className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-neutral-100 text-xs font-medium">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'dashboard' ? 'text-amber-800 font-bold' : 'text-neutral-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <button
            onClick={() => onSelectTab('guests')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'guests' ? 'text-amber-800 font-bold' : 'text-neutral-500'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الضيوف</span>
          </button>
          <button
            onClick={() => onSelectTab('tables')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'tables' ? 'text-amber-800 font-bold' : 'text-neutral-500'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>الطاولات</span>
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'stats' ? 'text-amber-800 font-bold' : 'text-neutral-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات</span>
          </button>
        </div>
      </div>
    </header>
  );
};
