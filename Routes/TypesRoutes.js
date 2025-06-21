import express from 'express';
import pool from '../Models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [types] = await pool.execute(`
            SELECT id_tip, tnaim
            FROM TipSn
        `);

        res.json(types);

    } catch (error) {
        console.error('Ошибка получения типов снаряжения:', error);
        res.status(500).json({ message: 'Ошибка загрузки типов снаряжения: ' + error.message });
    }
});

export default router;
