import { Request, Response } from 'express';
import { TableModel } from '../models/Table.js';
import { GuestModel } from '../models/Guest.js';
import { CapacityService } from '../services/capacityService.js';

export class TableController {
  static async getTables(req: Request, res: Response) {
    try {
      const tablesWithStats = await TableModel.getAllWithStats();
      return res.status(200).json({
        success: true,
        tables: tablesWithStats,
        count: tablesWithStats.length,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء جلب الطاولات',
      });
    }
  }

  static async getTableByNumber(req: Request, res: Response) {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const table = await TableModel.getTableStats(tableNumber);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: `طاولة رقم ${tableNumber} غير موجودة`,
        });
      }

      return res.status(200).json({
        success: true,
        table,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء جلب بيانات الطاولة',
      });
    }
  }

  static async createTable(req: Request, res: Response) {
    try {
      const validation = TableModel.validate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const { tableNumber, tableName, maxCapacity, notes } = req.body;
      const newTable = await TableModel.create({
        tableNumber: Number(tableNumber),
        tableName,
        maxCapacity: maxCapacity ? Number(maxCapacity) : 10,
        notes,
      });

      const stats = await TableModel.getTableStats(newTable.tableNumber);

      return res.status(201).json({
        success: true,
        message: `تم إنشاء طاولة رقم ${newTable.tableNumber} بنجاح`,
        table: stats || newTable,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'فشل في إنشاء الطاولة',
      });
    }
  }

  static async updateTable(req: Request, res: Response) {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const validation = TableModel.validate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const updated = await TableModel.update(tableNumber, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `طاولة رقم ${tableNumber} غير موجودة`,
        });
      }

      const stats = await TableModel.getTableStats(tableNumber);

      return res.status(200).json({
        success: true,
        message: `تم تحديث بيانات طاولة رقم ${tableNumber} بنجاح`,
        table: stats || updated,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'فشل في تحديث بيانات الطاولة',
      });
    }
  }

  static async deleteTable(req: Request, res: Response) {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const deleted = await TableModel.delete(tableNumber);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `طاولة رقم ${tableNumber} غير موجودة`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `تم حذف طاولة رقم ${tableNumber} بنجاح وإلغاء تسكين أي ضيوف كانوا عليها`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'فشل في حذف الطاولة',
      });
    }
  }

  static async assignGuestToTable(req: Request, res: Response) {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const { guestId } = req.body;

      if (!guestId) {
        return res.status(400).json({
          success: false,
          message: 'معرف الضيف مطلوب',
        });
      }

      const guest = await GuestModel.findById(guestId);
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'الضيف غير موجود',
        });
      }

      const capacityCheck = await CapacityService.canAssignGuestToTable(
        tableNumber,
        guest.totalGroupMembers,
        guestId
      );

      if (!capacityCheck.allowed) {
        return res.status(400).json({
          success: false,
          message: capacityCheck.errorMessageArabic || capacityCheck.errorMessage,
          details: capacityCheck,
        });
      }

      await GuestModel.update(guestId, { tableNumber });
      const updatedTable = await TableModel.getTableStats(tableNumber);

      return res.status(200).json({
        success: true,
        message: `تم تعيين الضيف ${guest.fullName} إلى طاولة رقم ${tableNumber}`,
        table: updatedTable,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تعيين الضيف للطاولة',
      });
    }
  }

  static async removeGuestFromTable(req: Request, res: Response) {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const { guestId } = req.params;

      const guest = await GuestModel.findById(guestId);
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'الضيف غير موجود',
        });
      }

      if (guest.tableNumber !== tableNumber) {
        return res.status(400).json({
          success: false,
          message: 'الضيف غير مسكن على هذه الطاولة',
        });
      }

      await GuestModel.update(guestId, { tableNumber: null });
      const updatedTable = await TableModel.getTableStats(tableNumber);

      return res.status(200).json({
        success: true,
        message: `تم إخلاء الضيف ${guest.fullName} من طاولة رقم ${tableNumber}`,
        table: updatedTable,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء إخلاء الضيف من الطاولة',
      });
    }
  }
}
