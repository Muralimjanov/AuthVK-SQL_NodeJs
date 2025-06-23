import express from 'express';
import { verifyToken, verifyAdmin } from '../Middleware/AuthMiddleware.js';
import {
    getEquipmentWithAvailability,
    getAllEquipment,
    getEquipmentList,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
} from '../Controllers/EquipmentController.js';

const router = express.Router();

router.get('/with-availability', verifyToken, verifyAdmin, getEquipmentWithAvailability);
router.get('/equipment', getAllEquipment);
router.get('/', verifyToken, verifyAdmin, getEquipmentList);
router.get('/:id', verifyToken, verifyAdmin, getEquipmentById);
router.post('/', verifyToken, verifyAdmin, createEquipment);
router.patch('/:id', verifyToken, verifyAdmin, updateEquipment);
router.delete('/:id', verifyToken, verifyAdmin, deleteEquipment);

export default router;

// verifyToken, verifyAdmin,