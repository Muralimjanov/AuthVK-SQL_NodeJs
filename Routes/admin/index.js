import { Router } from 'express';
import { requireRole, verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
import {
    secureDelete,
    getEquipment,
    updateEquipment,
    deleteEquipment,
    getUsers,
    updateUser,
    deleteUser,
    getRequests,
    getRequestItems,
    updateRequest,
    addRequestItem,
    deleteRequest,
    printRequest,
    getCategories
} from '../../Controllers/AdminController.js';

const router = Router();

router.post('/secure-delete', verifyToken, verifyAdmin, secureDelete);

router.get('/equipment', verifyToken, verifyAdmin, getEquipment);

router.patch('/equipment/:id', verifyToken, verifyAdmin, updateEquipment);

router.delete('/equipment/:id', verifyToken, verifyAdmin, deleteEquipment);

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

export default router;