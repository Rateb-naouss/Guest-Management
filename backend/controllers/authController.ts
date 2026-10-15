import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      let { email, password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال كلمة مرور المشرف',
        });
      }

      if (!email) {
        email = 'admin@wedding.com';
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'بيانات الدخول غير صحيحة: حساب المشرف غير مسجل',
        });
      }

      const isMatch = UserModel.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'بيانات الدخول غير صحيحة: كلمة المرور خاطئة',
        });
      }

      const token = UserModel.generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تسجيل الدخول',
      });
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'غير مصرح به' });
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ في استرجاع بيانات المستخدم',
      });
    }
  }

  static async resetData(req: AuthRequest, res: Response) {
    try {
      db.resetData();
      return res.status(200).json({
        success: true,
        message: 'تم إعادة تعيين البيانات التجريبية لحفل الزفاف بنجاح',
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'فشل في إعادة تعيين البيانات',
      });
    }
  }
}
