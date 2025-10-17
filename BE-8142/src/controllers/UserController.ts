import { Request, Response, Router } from 'express';
import * as UserService from '../services/UserService';
import { UserRole } from '@prisma/client';
import { authGuard, isAdmin, isUserLoggedIn } from '../middleware/AuthMiddleware';

const router = Router();

router.post('/', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const { name, username, password, role } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'İsim, kullanıcı adı ve parola gereklidir.' });
        }
        
        const user = await UserService.createUser({ name, username, password, role: role as UserRole || UserRole.member });
        res.status(201).json({ id: user.id, name: user.name, username: user.username, role: user.role });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
        }
        res.status(500).json({ message: 'Kullanıcı oluşturulurken bir hata oluştu.', error: error.message });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await UserService.getUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcılar listelenirken bir hata oluştu.' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const user = await UserService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı getirilirken bir hata oluştu.' });
    }
});

router.patch('/:id', authGuard, isUserLoggedIn, async (req: Request, res: Response) => {
    try {
        const targetId = parseInt(req.params.id);
        const currentUser = req.user!; 

        if (currentUser.role !== UserRole.admin && currentUser.id !== targetId) {
            return res.status(403).json({ message: 'Kendi hesabınız dışında kullanıcı güncelleyemezsiniz.' });
        }

        const { name, username, password, role } = req.body;
        
        if (role && currentUser.role !== UserRole.admin) {
             return res.status(403).json({ message: 'Rol ataması yapma yetkiniz yoktur.' });
        }

        const updatedUser = await UserService.updateUser(targetId, { name, username, password, role: role as UserRole });
        res.json({ id: updatedUser.id, name: updatedUser.name, username: updatedUser.username, role: updatedUser.role });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Güncellenecek kullanıcı bulunamadı.' });
        }
        res.status(500).json({ message: 'Kullanıcı güncellenirken bir hata oluştu.' });
    }
});

router.delete('/:id', authGuard, isUserLoggedIn, async (req: Request, res: Response) => {
    try {
        const targetId = parseInt(req.params.id);
        const currentUser = req.user!; 

        if (currentUser.role !== UserRole.admin && currentUser.id !== targetId) {
            return res.status(403).json({ message: 'Kendi hesabınız dışında kullanıcı silemezsiniz.' });
        }

        await UserService.deleteUser(targetId);
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Silinecek kullanıcı bulunamadı.' });
        }
        res.status(500).json({ message: 'Kullanıcı silinirken bir hata oluştu.' });
    }
});

export default router;