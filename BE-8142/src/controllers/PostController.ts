import { Request, Response, Router } from 'express';
import * as PostService from '../services/PostService';
import { authGuard, isUserLoggedIn } from '../middleware/AuthMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const posts = await PostService.findAll({});
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Gönderiler listelenirken bir hata oluştu.' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const post = await PostService.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Gönderi bulunamadı.' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Gönderi getirilirken bir hata oluştu.' });
    }
});

router.post('/', authGuard, isUserLoggedIn, async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { title, content, category_id } = req.body;

        if (!title || !content || !category_id) {
            return res.status(400).json({ message: 'Başlık, içerik ve kategori gereklidir.' });
        }
        
        const postData = {
            title: title,
            content: content,
            category_id: category_id,
        };

        const newPost = await PostService.create(currentUser.id, postData);
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: 'Gönderi oluşturulurken bir hata oluştu.' });
    }
});

router.patch('/:id', authGuard, isUserLoggedIn, async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.id);
        const currentUser = req.user!;
        const { title, content, category_id, published_at } = req.body;

        const post = await PostService.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Güncellenecek gönderi bulunamadı.' });
        }

        const isOwner = post.user_id === currentUser.id;
        const canModerate = currentUser.role === UserRole.moderator || currentUser.role === UserRole.admin;

        if (!isOwner && !canModerate) {
            return res.status(403).json({ message: 'Bu gönderiyi düzenleme yetkiniz yoktur.' });
        }
        
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category_id !== undefined) updateData.category_id = category_id;
        if (published_at !== undefined) updateData.published_at = published_at;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Güncellenecek alan bulunamadı.' });
        }

        const updatedPost = await PostService.update(postId, updateData);
        res.json(updatedPost);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Güncellenecek gönderi bulunamadı.' });
        }
        res.status(500).json({ message: 'Gönderi güncellenirken bir hata oluştu.' });
    }
});

router.delete('/:id', authGuard, isUserLoggedIn, async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.id);
        const currentUser = req.user!;

        const post = await PostService.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Silinecek gönderi bulunamadı.' });
        }

        const isOwner = post.user_id === currentUser.id;
        const isAdminUser = currentUser.role === UserRole.admin;

        if (!isOwner && !isAdminUser) {
            return res.status(403).json({ message: 'Bu gönderiyi silme yetkiniz yoktur.' });
        }

        await PostService.remove(postId);
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Silinecek gönderi bulunamadı.' });
        }
        res.status(500).json({ message: 'Gönderi silinirken bir hata oluştu.' });
    }
});

export default router;