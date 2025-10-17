import { Router } from 'express';
import * as PostController from '../controllers/PostController';

const router = Router();

router.post('/', PostController.create);
router.get('/', PostController.findAll);
router.get('/:id', PostController.findById);
router.patch('/:id', PostController.update);
router.delete('/:id', PostController.softDelete); 
router.post('/:id/tags', PostController.addTagToPost);    
router.delete('/:id/tags', PostController.removeTagFromPost); 

export default router;