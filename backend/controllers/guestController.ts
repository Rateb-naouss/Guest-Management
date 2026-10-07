import { Request, Response } from 'express';
import { GuestModel, GuestFilterOptions } from '../models/Guest.js';
import { TableModel } from '../models/Table.js';
import { CapacityService } from '../services/capacityService.js';

export class GuestController {
  static async getGuests(req: Request, res: Response) {
    try {
      const {
        search,
        gender,
        guestSide,
        invitationStatus,
        responseStatus,
        tableNumber,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const filters: GuestFilterOptions = {
        search: search as string,
        gender: gender as any,
        guestSide: guestSide as any,
        invitationStatus: invitationStatus as any,
        responseStatus: responseStatus as any,
        tableNumber: tableNumber !== undefined && tableNumber !== 'all'
          ? (tableNumber === 'unassigned' ? 'unassigned' : Number(tableNumber))
          : 'all',
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      };

      const result = await GuestModel.find(filters);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء جلب قائمة الضيوف',
      });
    }
  }

  static async getGuestById(req: Request, res: Response) {
    try {
      const guest = await GuestModel.findById(req.params.id);
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'الضيف غير موجود',
        });
      }
      return res.status(200).json({
        success: true,
        guest,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء جلب بيانات الضيف',
      });
    }
  }

  static async createGuest(req: Request, res: Response) {
    try {
      const validation = GuestModel.validate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const {
        fullName,
        phoneNumber,
        gender,
        guestSide,
        maleFamilyMembers,
        femaleFamilyMembers,
        invitationStatus,
        responseStatus,
        tableNumber,
        notes,
      } = req.body;

      const males = Math.max(0, Math.floor(Number(maleFamilyMembers) || 0));
      const females = Math.max(0, Math.floor(Number(femaleFamilyMembers) || 0));
      const groupSize = males + females + 1;

      // If a table is assigned, perform strict capacity check
      if (tableNumber !== null && tableNumber !== undefined && tableNumber !== '') {
        const tableNum = Number(tableNumber);
        const capacityCheck = await CapacityService.canAssignGuestToTable(tableNum, groupSize);
        if (!capacityCheck.allowed) {
          return res.status(400).json({
            success: false,
            message: capacityCheck.errorMessageArabic || capacityCheck.errorMessage,
            details: capacityCheck,
          });
        }
      }

      const newGuest = await GuestModel.create({
        fullName,
        phoneNumber,
        gender,
        guestSide: guestSide || 'groom',
        maleFamilyMembers: males,
        femaleFamilyMembers: females,
        invitationStatus: invitationStatus || 'invited',
        responseStatus: responseStatus || 'no_response',
        tableNumber: tableNumber ? Number(tableNumber) : null,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'تمت إضافة الضيف بنجاح',
        guest: newGuest,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء إضافة الضيف',
      });
    }
  }

  static async updateGuest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const existing = await GuestModel.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'الضيف غير موجود',
        });
      }

      const validation = GuestModel.validate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const males = req.body.maleFamilyMembers !== undefined
        ? Math.max(0, Math.floor(Number(req.body.maleFamilyMembers)))
        : existing.maleFamilyMembers;
      const females = req.body.femaleFamilyMembers !== undefined
        ? Math.max(0, Math.floor(Number(req.body.femaleFamilyMembers)))
        : existing.femaleFamilyMembers;
      const groupSize = males + females + 1;

      const targetTableNumber = req.body.tableNumber !== undefined
        ? (req.body.tableNumber === null || req.body.tableNumber === '' ? null : Number(req.body.tableNumber))
        : existing.tableNumber;

      // Check capacity if a table is assigned or group size is updated
      if (targetTableNumber !== null) {
        const capacityCheck = await CapacityService.canAssignGuestToTable(
          targetTableNumber,
          groupSize,
          id
        );
        if (!capacityCheck.allowed) {
          return res.status(400).json({
            success: false,
            message: capacityCheck.errorMessageArabic || capacityCheck.errorMessage,
            details: capacityCheck,
          });
        }
      }

      const updated = await GuestModel.update(id, {
        ...req.body,
        tableNumber: targetTableNumber,
      });

      return res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات الضيف بنجاح',
        guest: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تحديث بيانات الضيف',
      });
    }
  }

  static async deleteGuest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await GuestModel.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'الضيف غير موجود',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'تم حذف الضيف بنجاح',
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء حذف الضيف',
      });
    }
  }

  static async assignTable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tableNumber } = req.body;

      const guest = await GuestModel.findById(id);
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'الضيف غير موجود',
        });
      }

      // If unassigning
      if (tableNumber === null || tableNumber === undefined || tableNumber === '') {
        const updated = await GuestModel.update(id, { tableNumber: null });
        return res.status(200).json({
          success: true,
          message: 'تم إلغاء تعيين الطاولة للضيف',
          guest: updated,
        });
      }

      const tableNum = Number(tableNumber);
      const capacityCheck = await CapacityService.canAssignGuestToTable(
        tableNum,
        guest.totalGroupMembers,
        id
      );

      if (!capacityCheck.allowed) {
        return res.status(400).json({
          success: false,
          message: capacityCheck.errorMessageArabic || capacityCheck.errorMessage,
          details: capacityCheck,
        });
      }

      const updated = await GuestModel.update(id, { tableNumber: tableNum });
      return res.status(200).json({
        success: true,
        message: `تم تعيين الضيف بنجاح إلى طاولة رقم ${tableNum}`,
        guest: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تعيين الطاولة',
      });
    }
  }

  static async updateInvitationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { invitationStatus } = req.body;

      if (!['invited', 'not_invited'].includes(invitationStatus)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الدعوة غير صالحة',
        });
      }

      const updated = await GuestModel.update(id, { invitationStatus });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'الضيف غير موجود' });
      }

      return res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الدعوة بنجاح',
        guest: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تحديث حالة الدعوة',
      });
    }
  }

  static async updateResponseStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { responseStatus } = req.body;

      if (!['no_response', 'confirmed', 'declined'].includes(responseStatus)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الرد غير صالحة',
        });
      }

      const updated = await GuestModel.update(id, { responseStatus });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'الضيف غير موجود' });
      }

      return res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الرد بنجاح',
        guest: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تحديث حالة الرد',
      });
    }
  }
}
