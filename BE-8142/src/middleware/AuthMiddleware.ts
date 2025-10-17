import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { JWTPayload } from '../services/AuthService'; 

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'varsayilan_access_secret';
const prisma = new PrismaClient();

export function extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = extractTokenFromHeader(req);

    if (!accessToken) {
        return res.status(401).json({ message: 'Access Token gerekli.' });
    }

    try {
        const decodedToken = jwt.verify(accessToken, ACCESS_SECRET) as unknown; 
        const payload = decodedToken as JWTPayload; 
        
        if (!payload || !payload.sub || !payload.jti) {
             return res.status(401).json({ message: 'Geçersiz Token Yapısı.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub, deleted_at: null },
        });

        if (!user) {
            return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
        }

        req.user = user; 
        
        next();
    } catch (e: any) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access Token süresi doldu.' });
        }
        return res.status(401).json({ message: 'Geçersiz Access Token.' });
    }
};

export const isUserLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Bu işlem için oturum açmanız gerekmektedir.' });
    }
    next();
};

export const roleGuard = (requiredRole: UserRole) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(403).json({ message: 'Bu işlemi yapmak için yetkiniz yok.' });
    }

    const roleOrder = {
        [UserRole.member]: 0,
        [UserRole.moderator]: 1,
        [UserRole.admin]: 2,
    };

    const userRoleLevel = roleOrder[req.user.role];
    const requiredRoleLevel = roleOrder[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ message: 'Bu işlemi yapmak için yeterli yetkiniz (rolünüz) yok.' });
    }

    next();
};

export const isAdmin = roleGuard(UserRole.admin);
export const isModerator = roleGuard(UserRole.moderator);