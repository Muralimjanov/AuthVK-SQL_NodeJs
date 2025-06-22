import express from 'express';
import { verifyToken } from '../Middleware/AuthMiddleware.js';
import { addRequest, getRecentRequests, updateRequest, deleteRequest } from '../Controllers/RequestsController.js';

const router = express.Router();

router.post('/', verifyToken, addRequest);
router.get('/recent', verifyToken, getRecentRequests);
router.patch('/:id', verifyToken, updateRequest);
router.delete('/:id', verifyToken, deleteRequest);

export default router;