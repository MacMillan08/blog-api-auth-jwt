import { Router } from 'express';
import * as CommentController from '../controllers/CommentController';

const router = Router();

router.post('/', CommentController.create);
router.get('/', CommentController.findAll);
router.get('/:id', CommentController.findById);
router.patch('/:id', CommentController.update);
router.delete('/:id', CommentController.hardDelete); 

export default router;