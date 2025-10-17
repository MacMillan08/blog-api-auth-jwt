import { Request, Response, Router } from 'express';
import * as CategoryService from '../services/CategoryService';
import { authGuard, isAdmin } from '../middleware/AuthMiddleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const categories = await CategoryService.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Kategoriler listelenirken bir hata oluştu.' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const category = await CategoryService.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Kategori getirilirken bir hata oluştu.' });
    }
});

router.post('/', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'İsim alanı gereklidir.' });
        }
        
        const newCategory = await CategoryService.create({ name });
        res.status(201).json(newCategory);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Bu kategori zaten var.' });
        }
        res.status(500).json({ message: 'Kategori oluşturulurken bir hata oluştu.', error: error.message });
    }
});

router.patch('/:id', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        
        const updatedCategory = await CategoryService.update(id, { name });
        res.json(updatedCategory);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Güncellenecek kategori bulunamadı.' });
        }
        res.status(500).json({ message: 'Kategori güncellenirken bir hata oluştu.' });
    }
});

router.delete('/:id', authGuard, isAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await CategoryService.remove(id);
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Silinecek kategori bulunamadı.' });
        }
        res.status(500).json({ message: 'Kategori silinirken bir hata oluştu.' });
    }
});

export default router;