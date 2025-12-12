
import { Response } from 'express';

// Fix: Use any for res to avoid type errors
export const successResponse = (res: any, data: any, message: string = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

// Fix: Use any for res to avoid type errors
export const errorResponse = (res: any, status: number, message: string) => {
  return res.status(status).json({
    success: false,
    message,
  });
};