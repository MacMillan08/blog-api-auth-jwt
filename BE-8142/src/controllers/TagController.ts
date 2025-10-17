import { Request, Response, Router } from 'express';
import * as TagService from '../services/TagService';
import { authGuard, isAdmin } from '../middleware/AuthMiddleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const tags = await TagService.findAll();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: 'Etiketler listelenirken bir hata oluştu.' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const tag = await TagService.findById(id);
        if (!tag) {
            return res.status(404).json({ message: 'Etiket bulunamadı.' });
        }
        res.json(tag);
    } catch (error) {
        res.status(500).json({ message: 'Etiket getirilirken bir hata oluştu.' });
    }
});

router.post('/', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'İsim alanı gereklidir.' });
        }
        
        const newTag = await TagService.create(name);
        res.status(201).json(newTag);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Bu etiket zaten var.' });
        }
        res.status(500).json({ message: 'Etiket oluşturulurken bir hata oluştu.' });
    }
});

router.patch('/:id', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        
        const updatedTag = await TagService.update(id, name);
        res.json(updatedTag);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Güncellenecek etiket bulunamadı.' });
        }
        res.status(500).json({ message: 'Etiket güncellenirken bir hata oluştu.' });
    }
});

router.delete('/:id', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await TagService.remove(id);
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Silinecek etiket bulunamadı.' });
        }
        res.status(500).json({ message: 'Etiket silinirken bir hata oluştu.' });
    }
});

export default router;