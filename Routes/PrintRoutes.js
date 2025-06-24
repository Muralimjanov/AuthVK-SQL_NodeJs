import { Router } from "express";
import {
    verifyAdmin,
    verifyToken
} from "../Middleware/AuthMiddleware.js";
import {
    generateActReception,
    generateActTransmission
} from "../Controllers/PrintController.js";

const router = Router();

router.post('/act-reception', verifyToken, verifyAdmin, generateActReception);
router.post('/act-transmission', verifyToken, verifyAdmin, generateActTransmission);

export default router;