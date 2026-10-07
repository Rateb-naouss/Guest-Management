import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  X,
  FileSpreadsheet,
  Download,
  Users,
  UserCheck,
  UserX,
  Clock,
  UtensilsCrossed,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportOptions = [
    {
      type: 'all',
      title: 'قائمة الضيوف الكاملة (Complete Guest List)',
      desc: 'تصدير كافة سجلات الضيوف وأرقام هواتفهم، الجنس، المرافقين، حالة الدعوة والرد ورقم الطاولة.',
      icon: Users,
      color: 'text-neutral-800 bg-neutral-100',
    },
    {
      type: 'confirmed',
      title: 'الضيوف المؤكدون (Confirmed Guests)',
      desc: 'قائمة مخصصة بجميع الضيوف الذين أكدوا الحضور النهائي شاملاً أعداد مرافقيهم لتجهيز الضيافة.',
      icon: UserCheck,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      type: 'declined',
      title: 'الضيوف المعتذرون (Declined Guests)',
      desc: 'قائمة الضيوف الذين اعتذروا عن الحضور لتوثيق أسباب الاعتذار أو الملاحظات.',
      icon: UserX,
      color: 'text-rose-700 bg-rose-50',
    },
    {
      type: 'no_response',
      title: 'ضيوف بانتظار الرد (No Response)',
      desc: 'قائمة بالمدعوين المعلقين الذين لم يؤكدوا بعد للمتابعة والتذكير الهاتفي.',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      type: 'tables',
      title: 'توزيع وتسكين الطاولات (Table Assignments)',
      desc: 'مخطط الطاولات التفصيلي: السعة القصوى، المقاعد المشغولة والشاغرة وقوائم الضيوف المسكنين لكل طاولة.',
      icon: UtensilsCrossed,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      type: 'gender_stats',
      title: 'إحصائيات الرجال والنساء (Men & Women Statistics)',
      desc: 'تقرير إحصائي دقيق بتوزيع الذكور والإناث (المؤكدين، المعتذرين، وبانتظار الرد).',
      icon: BarChart3,
      color: 'text-purple-700 bg-purple-50',
    },
    {
      type: 'attendance_stats',
      title: 'إحصائيات الحضور والغياب الشاملة (Attendance Statistics)',
      desc: 'ورقة عمل تحليلية متكاملة تتضمن نسب التأكيد، إشغال القاعة ومؤشرات الحفل.',
      icon: CheckCircle2,
      color: 'text-emerald-800 bg-emerald-100',
    },
  ];

  const handleExport = async (type: string) => {
    setDownloadingType(type);
    try {
      await api.downloadExcel(type);
      success('تم تصدير ملف الإكسل بنجاح');
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تصدير الملف');
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">تصدير بيانات وتقارير الزفاف إلى Excel</h2>
              <span className="text-xs text-neutral-500">
                ملفات إكسل منسقة وجاهزة للطباعة مع دعم كامل للغة العربية (RTL)
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

        {/* Options list */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {exportOptions.map((opt) => {
            const Icon = opt.icon;
            const isCurrentDownloading = downloadingType === opt.type;

            return (
              <div
                key={opt.type}
                className="p-4 rounded-xl border border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${opt.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 group-hover:text-emerald-950 transition-colors">
                      {opt.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleExport(opt.type)}
                  disabled={isCurrentDownloading || downloadingType !== null}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap self-end sm:self-auto"
                >
                  <Download className={`w-3.5 h-3.5 ${isCurrentDownloading ? 'animate-bounce' : ''}`} />
                  <span>{isCurrentDownloading ? 'جاري التحميل...' : 'تصدير (.xlsx)'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>صيغة الملف: Microsoft Excel (.xlsx) المتوافقة مع جميع الأجهزة</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
