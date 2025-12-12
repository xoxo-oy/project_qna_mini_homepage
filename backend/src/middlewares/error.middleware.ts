
import { Request, Response, NextFunction } from 'express';

// Fix: Use any for arguments to avoid type errors
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error('[Error]', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
  });
};