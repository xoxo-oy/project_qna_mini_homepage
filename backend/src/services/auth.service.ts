
import { prisma } from '../server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  async register(data: any) {
    const { email, password, nickname } = data;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw { status: 400, message: '이미 존재하는 이메일입니다.' };

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        email, 
        nickname, 
        password: hashedPassword,
        bio: '안녕하세요! 제 미니홈피에 오신 것을 환영합니다.' 
      },
    });

    return { id: user.id, email: user.email, nickname: user.nickname };
  }

  async login(data: any) {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw { status: 401, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    
    return { 
        token, 
        user: { id: user.id, email: user.email, nickname: user.nickname, bio: user.bio } 
    };
  }

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { id: true, nickname: true, email: true, bio: true }
    });
    if (!user) throw { status: 404, message: '사용자를 찾을 수 없습니다.' };
    return user;
  }
}
