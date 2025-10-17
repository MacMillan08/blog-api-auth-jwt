import { Request, Response, Router, NextFunction } from 'express';
import * as PostTagService from '../services/PostTagService';
import * as PostService from '../services/PostService';
import { authGuard, isUserLoggedIn } from '../middleware/AuthMiddleware';
import { UserRole } from '@prisma/client';

const router = Router({ mergeParams: true }); 

const canModifyPostTag = async (req: Request, res: Response, next: NextFunction) => {
    const postId = parseInt(req.params.postId);
    const currentUser = req.user!; 

    const post = await PostService.findById(postId);
    if (!post) {
        return res.status(404).json({ message: 'İlgili gönderi bulunamadı.' });
    }

    const isOwner = post.user_id === currentUser.id;
    const canModerate = currentUser.role === UserRole.moderator || currentUser.role === UserRole.admin;

    if (!isOwner && !canModerate) {
        return res.status(403).json({ message: 'Bu gönderiye etiket ekleme/kaldırma yetkiniz yoktur.' });
    }

    next();
};

router.get('/', async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.postId);
        const tags = await PostTagService.getPostTags(postId);
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: 'Etiketler listelenirken bir hata oluştu.' });
    }
});

router.post('/', authGuard, isUserLoggedIn, canModifyPostTag, async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.postId);
        const { tagId } = req.body; 

        if (!tagId) {
            return res.status(400).json({ message: 'Etiket ID (tagId) gereklidir.' });
        }

        const newPostTag = await PostTagService.addTagToPost(postId, parseInt(tagId));
        res.status(201).json(newPostTag);
    } catch (error: any) {
         if (error.code === 'P2002') { 
            return res.status(409).json({ message: 'Bu etiket zaten gönderiye ekli.' });
        }
        res.status(500).json({ message: 'Etiket eklenirken bir hata oluştu.' });
    }
});

router.delete('/:tagId', authGuard, isUserLoggedIn, canModifyPostTag, async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.postId);
        const tagId = parseInt(req.params.tagId);

        await PostTagService.removeTagFromPost(postId, tagId);
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Kaldırılacak etiket bulunamadı.' });
        }
        res.status(500).json({ message: 'Etiket kaldırılırken bir hata oluştu.' });
    }
});

export default router;