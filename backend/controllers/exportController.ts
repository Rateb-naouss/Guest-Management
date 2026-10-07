import { Request, Response } from 'express';
import { ExcelService, ExportType } from '../services/excelService.js';

export class ExportController {
  static async exportExcel(req: Request, res: Response) {
    try {
      const type = (req.query.type as ExportType) || 'all';

      const validTypes: ExportType[] = [
        'all',
        'confirmed',
        'declined',
        'no_response',
        'tables',
        'gender_stats',
        'attendance_stats',
        'full_report',
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'نوع التصدير المحدد غير صالح',
        });
      }

      const { buffer, filename } = await ExcelService.generateWorkbook(type);

      // Encode filename for UTF-8 support in headers
      const encodedFilename = encodeURIComponent(filename);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Content-Length', buffer.length.toString());

      return res.end(buffer);
    } catch (err: any) {
      console.error('Excel Export Error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تصدير ملف الإكسل',
      });
    }
  }
}
