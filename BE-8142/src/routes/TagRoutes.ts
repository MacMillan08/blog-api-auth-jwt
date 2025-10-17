import { Router } from 'express';
import * as TagController from '../controllers/TagController'; 

const router = Router();
router.post('/', TagController.create);
router.get('/', TagController.findAll);
router.get('/:id', TagController.findById);
router.patch('/:id', TagController.update);
router.delete('/:id', TagController.hardDelete); 

export default router;