import express from 'express';
import pool from '../Models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        console.log('Запрос списка снаряжения');

        const [equipment] = await pool.execute(`
            SELECT 
                VidSn.id_vid,
                TipSn.tnaim,
                VidSn.vnaim,
                VidSn.kolich,
                VidSn.zenaz,
                VidSn.zenapr,
                VidSn.sost
            FROM VidSn
            LEFT JOIN TipSn ON VidSn.id_tip = TipSn.id_tip
        `);

        console.log(`Найдено ${equipment.length} единиц снаряжения`);
        res.json(equipment);

    } catch (error) {
        console.error('Ошибка получения снаряжения:', error);
        res.status(500).json({ message: 'Ошибка загрузки снаряжения: ' + error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [equipment] = await pool.execute(`
            SELECT 
                VidSn.id_vid,
                VidSn.vnaim,
                VidSn.kolich,
                VidSn.zenaz,
                VidSn.zenapr,
                VidSn.sost
            FROM VidSn 
            WHERE VidSn.id_vid = ?
        `, [id]);

        if (equipment.length === 0) {
            return res.status(404).json({ message: 'Снаряжение не найдено' });
        }

        res.json(equipment[0]);

    } catch (error) {
        console.error('Ошибка получения снаряжения:', error);
        res.status(500).json({ message: 'Ошибка загрузки снаряжения: ' + error.message });
    }
});

router.get('/with-availability', async (req, res) => {
    try {
        const [equipment] = await pool.execute(`
            SELECT 
                v.id_vid,
                v.vnaim,
                v.kolich AS total_quantity
            FROM VidSn v
        `);

        const [issuedItems] = await pool.execute(`
            SELECT 
                z.id_vid,
                z.status,
                SUM(z.kolich) as total_issued
            FROM ZayavkaSn z
            WHERE z.status IN ('на рассмотрении', 'предварительно оплачен', 'оплачен')
            GROUP BY z.id_vid, z.status
        `);

        const issuedMap = {};
        for (const item of issuedItems) {
            if (!issuedMap[item.id_vid]) issuedMap[item.id_vid] = {};
            issuedMap[item.id_vid][item.status] = item.total_issued;
        }

        const result = equipment.map(eq => {
            const issued = issuedMap[eq.id_vid] || {};

            const totalIssuedAll =
                (issued['на рассмотрении'] || 0) +
                (issued['предварительно оплачен'] || 0) +
                (issued['оплачен'] || 0);

            const totalIssuedPaid =
                (issued['предварительно оплачен'] || 0) +
                (issued['оплачен'] || 0);

            const availability = eq.total_quantity - totalIssuedAll;
            const availabilityPaid = eq.total_quantity - totalIssuedPaid;

            let calendarStatus = 'green';
            if (availability <= 0) {
                calendarStatus = 'yellow';
            }
            if (availabilityPaid <= 0) {
                calendarStatus = 'red';
            }

            return {
                id_vid: eq.id_vid,
                vnaim: eq.vnaim,
                total_quantity: eq.total_quantity,
                availability,
                calendarStatus
            };
        });

        res.json(result);

    } catch (error) {
        console.error('Ошибка при загрузке снаряжения с доступностью:', error);
        res.status(500).json({ message: 'Ошибка загрузки снаряжения: ' + error.message });
    }
});

router.get('/equipment', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM VidSn ORDER BY id_vid
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка получения снаряжения' });
    }
});

export default router;
