import { Router } from 'express';
import { requireRole, verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
import {
    addUsers,
    getUsers,
    updateUser,
    deleteUser,
    getRequests,
    getRequestItems,
    updateRequest,
    addRequestItem,
    deleteRequest,
    printRequest,
    getCategories,
    getStatuses,
    getUserRequests
} from '../../Controllers/AdminController.js';

const router = Router();

router.post('/users', verifyToken, verifyAdmin, addUsers);
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.patch('/users/:id', verifyToken, verifyAdmin, updateUser);
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);
router.get('/requests', verifyToken, verifyAdmin, getRequests);
router.get('/requests/:id/items', verifyToken, verifyAdmin, getRequestItems);
router.patch('/requests/:id', verifyToken, verifyAdmin, updateRequest);
router.post('/requests/:id/items', verifyToken, verifyAdmin, addRequestItem);
router.delete('/requests/:id', verifyToken, verifyAdmin, deleteRequest);
router.post('/requests/:id/print', verifyToken, verifyAdmin, printRequest);
router.get('/categories', verifyToken, verifyAdmin, getCategories);
router.get('/statuses', verifyToken, verifyAdmin, getStatuses);
router.get('/requests/user/:userId', verifyToken, verifyAdmin, getUserRequests);


export default router;