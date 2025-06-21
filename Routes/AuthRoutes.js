import {Router} from 'express';
import { vkAuth } from '../Controllers/AuthController.js';

const router = Router();

router.post('/vk-login', vkAuth);

export default router;
