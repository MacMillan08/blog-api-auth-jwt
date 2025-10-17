import { Request, Response, Router } from 'express';
import * as AuthService from '../services/AuthService';
import * as UserService from '../services/UserService';
import { authGuard, extractTokenFromHeader } from '../middleware/AuthMiddleware';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'İsim, kullanıcı adı ve parola gereklidir.' });
        }
        
        const newUser = await UserService.createUser({ name, username, password });
        const tokens = await AuthService.createTokenPair(newUser);

        res.status(201).json({ 
            user: { id: newUser.id, username: newUser.username, role: newUser.role }, 
            ...tokens 
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Bu kullanıcı adı zaten kayıtlı.' });
        }
        res.status(500).json({ message: 'Kayıt işlemi başarısız oldu.', error: error.message });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Kullanıcı adı ve parola gereklidir.' });
        }

        const user = await AuthService.loginUser(username, password);

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya parola.' });
        }

        const tokens = await AuthService.createTokenPair(user);

        res.json({ 
            user: { id: user.id, username: user.username, role: user.role }, 
            ...tokens 
        });

    } catch (error) {
        res.status(500).json({ message: 'Giriş işlemi başarısız oldu.' });
    }
});

router.post('/refresh', async (req: Request, res: Response) => {
    const refreshToken = extractTokenFromHeader(req); 

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh Token gereklidir.' });
    }

    try {
        const newTokens = await AuthService.refreshTokens(refreshToken);

        if (!newTokens) {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş Refresh Token. Lütfen tekrar giriş yapın.' });
        }

        res.json(newTokens);
    } catch (error) {
        res.status(500).json({ message: 'Token yenileme başarısız oldu.' });
    }
});

router.post('/logout', async (req: Request, res: Response) => {
    const refreshToken = extractTokenFromHeader(req); 

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh Token gereklidir.' });
    }

    await AuthService.logoutUser(refreshToken);
    
    res.status(200).json({ message: 'Başarıyla çıkış yapıldı.' });
});

router.post('/me', authGuard, async (req: Request, res: Response) => {
   
    const user = req.user; 
    
    res.json({ id: user!.id, username: user!.username, name: user!.name, role: user!.role });
});

export default router;