import express from 'express';
import { verifyToken } from '../Middleware/AuthMiddleware.js';
import {
    getRecentRequests,
    createRequest,
    deleteRequest,
    patchRequest
} from '../Controllers/RequestsController.js';

const router = express.Router();

router.post('/', verifyToken, createRequest);
router.get('/recent', verifyToken, getRecentRequests);
router.patch('/:id', verifyToken, patchRequest);
router.delete('/:id', verifyToken, deleteRequest);

export default router;