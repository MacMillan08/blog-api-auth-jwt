import { Router } from 'express';
import * as CategoryController from '../controllers/CategoryController';

const router = Router();

router.post('/', CategoryController.create);
router.get('/', CategoryController.findAll);
router.get('/:id', CategoryController.findById);
router.patch('/:id', CategoryController.update);
router.delete('/:id', CategoryController.softDelete); 

export default router;