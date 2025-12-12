
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../utils/response';
import { z } from 'zod';

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().min(2),
});

// Fix: Use any for req/res to avoid type errors (e.g., missing body)
export const register = async (req: any, res: any, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const data = await authService.register(validatedData);
    successResponse(res, data, '회원가입 성공');
  } catch (error) {
    next(error);
  }
};

// Fix: Use any for req/res to avoid type errors
export const login = async (req: any, res: any, next: NextFunction) => {
  try {
    const { token, user } = await authService.login(req.body);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, { user }, '로그인 성공');
  } catch (error) {
    next(error);
  }
};

// Fix: Use any for req/res to avoid type errors
export const logout = (req: any, res: any) => {
  res.clearCookie('access_token');
  successResponse(res, null, '로그아웃 되었습니다.');
};

// Fix: Use any for req/res to avoid type errors
export const getMe = async (req: any, res: any, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user.id);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};