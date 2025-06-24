import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import requestsRouter from './Routes/RequestsRoutes.js';
import cron from 'node-cron';
import { autoReturnOverdue } from './jobs/autoReturnJob.js';
import adminRoutes from './Routes/admin/index.js';
import './Models/database.js';
import equipmentRoutes from './Routes/EquipmentRoutes.js';
import typesRoutes from './Routes/TypesRoutes.js';
import authRoutes from './Routes/AuthRoutes.js';
import printRoutes from './Routes/PrintRoutes.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'VK Equipment API работает',
        status: 'OK',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/types', typesRoutes);
app.use('/api/requests', requestsRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/print', printRoutes);

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Маршрут не найден',
        path: req.originalUrl,
        method: req.method
    });
});

cron.schedule('0 2 * * *', () => {
    console.log('Ежедневная проверка просроченных заявок...');
    autoReturnOverdue();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
