import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح بالوصول: يرجى تسجيل الدخول كمسؤول أولاً',
      messageEn: 'Unauthorized: Admin authentication token required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = UserModel.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية',
      messageEn: 'Invalid or expired token',
    });
  }

  req.user = decoded;
  next();
};
