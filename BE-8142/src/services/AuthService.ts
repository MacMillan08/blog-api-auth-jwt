import { PrismaClient, User, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as UserService from './UserService';

const prisma = new PrismaClient();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'varsayilan_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'varsayilan_refresh_secret';
const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_LIFE || '15m';
const REFRESH_TOKEN_LIFE_DAYS = parseInt(process.env.REFRESH_TOKEN_LIFE?.replace('d', '') || '7');

export interface JWTPayload {
    sub: number;
    username: string;
    role: UserRole;
    jti: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export async function createTokenPair(user: User): Promise<TokenPair> {
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_LIFE_DAYS);

    const refreshTokenRef = await prisma.refreshToken.create({
        data: {
            user_id: user.id,
            expires_at: expiryDate,
        }
    });

    const payload: JWTPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        jti: refreshTokenRef.id.toString(), 
    };

    const accessOptions = {
        expiresIn: ACCESS_TOKEN_LIFE as string,
        audience: 'blog-api-users',
        issuer: 'blog-api',
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, accessOptions);

    const refreshOptions = {
        expiresIn: (REFRESH_TOKEN_LIFE_DAYS + 'd') as string,
        audience: 'blog-api-refresh',
        issuer: 'blog-api',
    };

    const refreshToken = jwt.sign({ jti: payload.jti }, REFRESH_SECRET, refreshOptions);

    return { accessToken, refreshToken };
}

export async function loginUser(username: string, password: string): Promise<User | null> {
    const user = await UserService.getUserByUsername(username);

    if (!user) {
        return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    
    if (!passwordMatch) {
        return null;
    }

    return user;
}

export async function refreshTokens(token: string): Promise<TokenPair | null> {
    let payload: any;
    try {
        payload = jwt.verify(token, REFRESH_SECRET);
        if (!payload || !payload.jti) {
            return null;
        }
    } catch (e) {
        return null;
    }

    const jti = parseInt(payload.jti);
    
    const tokenRef = await prisma.refreshToken.findUnique({
        where: { id: jti },
        include: { user: true },
    });

    if (!tokenRef || !tokenRef.user || tokenRef.revoked_at || tokenRef.expires_at < new Date()) {
        if(tokenRef && tokenRef.user) {
             await prisma.refreshToken.updateMany({
                where: { user_id: tokenRef.user.id },
                data: { revoked_at: new Date() },
            });
        }
        return null;
    }

    await prisma.refreshToken.update({
        where: { id: jti },
        data: { revoked_at: new Date() },
    });
    
    const newTokenPair = await createTokenPair(tokenRef.user);

    return newTokenPair;
}

export async function logoutUser(token: string): Promise<boolean> {
    let payload: any;
    try {
        payload = jwt.verify(token, REFRESH_SECRET);
        if (!payload || !payload.jti) {
            return false;
        }
    } catch (e) {
        return false;
    }

    const jti = parseInt(payload.jti);

    try {
        await prisma.refreshToken.updateMany({
            where: { id: jti, revoked_at: null },
            data: { revoked_at: new Date() },
        });
        return true;
    } catch (e) {
        return false;
    }
}