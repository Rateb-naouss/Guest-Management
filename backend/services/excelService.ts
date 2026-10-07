import * as XLSX from 'xlsx';
import { db } from '../config/db.js';
import { TableModel } from '../models/Table.js';

export type ExportType =
  | 'all'
  | 'confirmed'
  | 'declined'
  | 'no_response'
  | 'tables'
  | 'gender_stats'
  | 'attendance_stats'
  | 'full_report';

export class ExcelService {
  static async generateWorkbook(type: ExportType): Promise<{ buffer: Buffer; filename: string }> {
    const wb = XLSX.utils.book_new();

    const arabicGender = (g: string) => (g === 'male' ? 'ذكر' : 'أنثى');
    const arabicInvStatus = (s: string) => (s === 'invited' ? 'تمت الدعوة' : 'لم تتم الدعوة');
    const arabicRespStatus = (s: string) => {
      switch (s) {
        case 'confirmed':
          return 'مؤكد الحضور';
        case 'declined':
          return 'معتذر';
        default:
          return 'بانتظار الرد';
      }
    };

    const nowStr = new Date().toISOString().split('T')[0];

    if (type === 'all' || type === 'confirmed' || type === 'declined' || type === 'no_response') {
      let filtered = [...db.guests];
      let sheetTitle = 'قائمة الضيوف الكاملة';
      let filePrefix = 'جميع_ضيوف_الزفاف';

      if (type === 'confirmed') {
        filtered = filtered.filter((g) => g.responseStatus === 'confirmed');
        sheetTitle = 'الضيوف المؤكدون';
        filePrefix = 'الضيوف_المؤكدون';
      } else if (type === 'declined') {
        filtered = filtered.filter((g) => g.responseStatus === 'declined');
        sheetTitle = 'الضيوف المعتذرون';
        filePrefix = 'الضيوف_المعتذرون';
      } else if (type === 'no_response') {
        filtered = filtered.filter((g) => g.responseStatus === 'no_response');
        sheetTitle = 'ضيوف بانتظار الرد';
        filePrefix = 'ضيوف_بانتظار_الرد';
      }

      const rows = filtered.map((g, idx) => ({
        'م': idx + 1,
        'الاسم الكامل': g.fullName,
        'رقم الهاتف': g.phoneNumber,
        'طرف الدعوة': g.guestSide === 'bride' ? 'ضيوف العروس' : 'ضيوف العريس',
        'الجنس': arabicGender(g.gender),
        'أفراد العائلة (ذكور)': g.maleFamilyMembers,
        'أفراد العائلة (إناث)': g.femaleFamilyMembers,
        'إجمالي المجموعة': g.totalGroupMembers,
        'إجمالي الذكور': g.totalMales,
        'إجمالي الإناث': g.totalFemales,
        'حالة الدعوة': arabicInvStatus(g.invitationStatus),
        'حالة الرد': arabicRespStatus(g.responseStatus),
        'رقم الطاولة': g.tableNumber ? `طاولة ${g.tableNumber}` : 'غير معين',
        'ملاحظات': g.notes || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 16 },
        { wch: 10 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 25 },
      ];
      // Set right to left
      ws['!views'] = [{ RTL: true }];

      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31));
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return { buffer, filename: `${filePrefix}_${nowStr}.xlsx` };
    }

    if (type === 'tables') {
      const tablesWithStats = await TableModel.getAllWithStats();
      const rows: any[] = [];

      for (const t of tablesWithStats) {
        if (t.assignedGuests.length === 0) {
          rows.push({
            'رقم الطاولة': t.tableNumber,
            'اسم الطاولة': t.tableName || `طاولة ${t.tableNumber}`,
            'السعة القصوى': t.maxCapacity,
            'الأشخاص المسكنين': 0,
            'المقاعد الشاغرة': t.maxCapacity,
            'حالة الامتلاء': 'فارغة',
            'اسم الضيف': '-',
            'رقم الهاتف': '-',
            'حجم المجموعة': 0,
            'حالة الرد': '-',
          });
        } else {
          t.assignedGuests.forEach((g) => {
            rows.push({
              'رقم الطاولة': t.tableNumber,
              'اسم الطاولة': t.tableName || `طاولة ${t.tableNumber}`,
              'السعة القصوى': t.maxCapacity,
              'الأشخاص المسكنين': t.currentPeople,
              'المقاعد الشاغرة': t.remainingSeats,
              'حالة الامتلاء': t.isFull ? 'ممتلئة بالكامل' : `${t.remainingSeats} مقاعد شاغرة`,
              'اسم الضيف': g.fullName,
              'رقم الهاتف': g.phoneNumber,
              'حجم المجموعة': g.totalGroupMembers,
              'حالة الرد': arabicRespStatus(g.responseStatus),
            });
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 12 },
        { wch: 22 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 26 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
      ];
      ws['!views'] = [{ RTL: true }];

      XLSX.utils.book_append_sheet(wb, ws, 'توزيع الطاولات');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return { buffer, filename: `توزيع_طاولات_الزفاف_${nowStr}.xlsx` };
    }

    if (type === 'gender_stats' || type === 'attendance_stats' || type === 'full_report') {
      // Calculate gender and attendance statistics
      const allGuests = db.guests;
      const totalCards = allGuests.length;
      const totalPeople = allGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const totalMales = allGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const totalFemales = allGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      const confirmedGuests = allGuests.filter((g) => g.responseStatus === 'confirmed');
      const confirmedCards = confirmedGuests.length;
      const confirmedPeople = confirmedGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const confirmedMales = confirmedGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const confirmedFemales = confirmedGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      const declinedGuests = allGuests.filter((g) => g.responseStatus === 'declined');
      const declinedCards = declinedGuests.length;
      const declinedPeople = declinedGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const declinedMales = declinedGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const declinedFemales = declinedGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      const noResponseGuests = allGuests.filter((g) => g.responseStatus === 'no_response');
      const noResponseCards = noResponseGuests.length;
      const noResponsePeople = noResponseGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const noResponseMales = noResponseGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const noResponseFemales = noResponseGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      const statsRows = [
        { 'المؤشر الإحصائي': 'إجمالي بطاقات الضيوف (سجلات)', 'القيمة الإجمالية': totalCards, 'المؤكد': confirmedCards, 'المعتذر': declinedCards, 'بانتظار الرد': noResponseCards },
        { 'المؤشر الإحصائي': 'إجمالي الأفراد (شاملاً العائلات)', 'القيمة الإجمالية': totalPeople, 'المؤكد': confirmedPeople, 'المعتذر': declinedPeople, 'بانتظار الرد': noResponsePeople },
        { 'المؤشر الإحصائي': 'إجمالي الذكور (شاملاً المرافقين)', 'القيمة الإجمالية': totalMales, 'المؤكد': confirmedMales, 'المعتذر': declinedMales, 'بانتظار الرد': noResponseMales },
        { 'المؤشر الإحصائي': 'إجمالي الإناث (شاملاً المرافقات)', 'القيمة الإجمالية': totalFemales, 'المؤكد': confirmedFemales, 'المعتذر': declinedFemales, 'بانتظار الرد': noResponseFemales },
      ];

      const wsStats = XLSX.utils.json_to_sheet(statsRows);
      wsStats['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
      wsStats['!views'] = [{ RTL: true }];
      XLSX.utils.book_append_sheet(wb, wsStats, 'إحصائيات الرجال والنساء');

      // Also append tables summary
      const tablesWithStats = await TableModel.getAllWithStats();
      const tablesSummary = tablesWithStats.map((t) => ({
        'رقم الطاولة': t.tableNumber,
        'اسم الطاولة': t.tableName || `طاولة ${t.tableNumber}`,
        'السعة القصوى': t.maxCapacity,
        'المسكنين حالياً': t.currentPeople,
        'المؤكدين حالياً': t.confirmedPeople,
        'المقاعد الشاغرة (إجمالي)': t.remainingSeats,
        'نسبة الإشغال': `${Math.round((t.currentPeople / t.maxCapacity) * 100)}%`,
        'عدد العائلات/المجموعات': t.assignedGuests.length,
      }));
      const wsTables = XLSX.utils.json_to_sheet(tablesSummary);
      wsTables['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 20 }];
      wsTables['!views'] = [{ RTL: true }];
      XLSX.utils.book_append_sheet(wb, wsTables, 'ملخص الطاولات');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return { buffer, filename: `تقرير_إحصائيات_الزفاف_${nowStr}.xlsx` };
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return { buffer, filename: `تقرير_الزفاف_${nowStr}.xlsx` };
  }
}
