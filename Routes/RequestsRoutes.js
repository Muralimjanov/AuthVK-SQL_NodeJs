import express from 'express';
import pool from '../Models/database.js';
import { verifyToken } from '../Middleware/AuthMiddleware.js';
import { stringify } from 'csv-stringify/sync';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const { user } = req;

        let query = `
            SELECT z.id, z.id_vid, v.vnaim, z.kolich, z.status, z.data_start, z.data_end, z.created_at
            FROM ZayavkaSn z
            JOIN VidSn v ON v.id_vid = z.id_vid
        `;

        const params = [];

        if (user.role === 'Арендатор') {
            query += ` WHERE z.user_id = ?`;
            params.push(user.id);
        }

        query += ` ORDER BY z.created_at DESC`;

        const [requests] = await pool.execute(query, params);

        res.json(requests);
    } catch (error) {
        console.error('Ошибка при получении заявок:', error);
        res.status(500).json({ message: 'Ошибка получения заявок' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { user } = req;
        const { id_vid, kolich, data_start, data_end } = req.body;

        if (!id_vid || !kolich || !data_start || !data_end) {
            return res.status(400).json({ message: 'Поля обязательны' });
        }

        await pool.execute(`
            INSERT INTO ZayavkaSn (user_id, id_vid, kolich, data_start, data_end)
            VALUES (?, ?, ?, ?, ?)
        `, [
            user.id,
            id_vid,
            kolich,
            data_start,
            data_end
        ]);

        res.status(201).json({ message: 'Заявка создана' });
    } catch (error) {
        console.error('Ошибка при создании заявки:', error);
        res.status(500).json({ message: 'Ошибка создания заявки' });
    }
});

router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;
        const { status } = req.body;

        if (user.role !== 'Заведующий') {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }

        const allowedStatuses = [
            'на рассмотрении', 'предварительно оплачен', 'оплачен', 'отклонён', 'выдан', 'возвращён'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Недопустимый статус' });
        }

        await pool.execute(`
            UPDATE ZayavkaSn SET status = ? WHERE id = ?
        `,
            [status, id]
        );

        res.json({ message: 'Статус обновлён' });
    } catch (error) {
        console.error('Ошибка при обновлении статуса заявки:', error);
        res.status(500).json({ message: 'Ошибка обновления статуса' });
    }
});

router.patch('/:id/issue', verifyToken, async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;

        if (user.role !== 'Заведующий') {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        const [[zayavka]] = await pool.execute(`
            SELECT * FROM ZayavkaSn WHERE id = ?
        `, [id]);

        if (!zayavka) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }
        if (zayavka.status !== 'оплачен') {
            return res.status(400).json({ message: 'Можно выдавать только оплаченные заявки' });
        }

        const [[equipment]] = await pool.execute(`
            SELECT kolich FROM VidSn WHERE id_vid = ?
        `,
            [zayavka.id_vid]
        );

        if (!equipment || equipment.kolich < zayavka.kolich) {
            return res.status(400).json({ message: 'Недостаточно снаряжения на складе' });
        }

        await pool.execute(`UPDATE ZayavkaSn SET status = 'выдан' WHERE id = ?`, [id]);
        await pool.execute(`UPDATE VidSn SET kolich = kolich - ? WHERE id_vid = ?`, [zayavka.kolich, zayavka.id_vid]);

        res.json({ message: 'Снаряжение выдано' });

    } catch (error) {
        console.error('Ошибка выдачи:', error);
        res.status(500).json({ message: 'Ошибка при выдаче' });
    }
});

router.patch('/:id/return', verifyToken, async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;

        if (user.role !== 'Заведующий') {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        const [[zayavka]] = await pool.execute(`SELECT * FROM ZayavkaSn WHERE id = ?`, [id]);

        if (!zayavka) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }
        if (zayavka.status !== 'выдан') {
            return res.status(400).json({ message: 'Можно вернуть только выданное снаряжение' });
        }

        await pool.execute(`UPDATE ZayavkaSn SET status = 'возвращён' WHERE id = ?`, [id]);
        await pool.execute(`UPDATE VidSn SET kolich = kolich + ? WHERE id_vid = ?`, [zayavka.kolich, zayavka.id_vid]);

        res.json({ message: 'Снаряжение возвращено' });

    } catch (error) {
        console.error('Ошибка возврата:', error);
        res.status(500).json({ message: 'Ошибка возврата' });
    }
});

router.get('/filter', verifyToken, async (req, res) => {
    try {
        const { status, user_id, date_from, date_to } = req.query;

        let query = `
            SELECT z.id, z.id_vid, v.vnaim, z.kolich, z.status, z.data_start, z.data_end, z.created_at, u.name
            FROM ZayavkaSn z
            JOIN VidSn v ON z.id_vid = v.id_vid
            JOIN users u ON z.user_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ' AND z.status = ?';
            params.push(status);
        }

        if (user_id) {
            query += ' AND z.user_id = ?';
            params.push(user_id);
        }

        if (date_from) {
            query += ' AND z.created_at >= ?';
            params.push(date_from);
        }

        if (date_to) {
            query += ' AND z.created_at <= ?';
            params.push(date_to);
        }

        const [rows] = await pool.execute(query, params);
        res.json(rows);

    } catch (error) {
        console.error('Ошибка фильтрации заявок:', error);
        res.status(500).json({ message: 'Ошибка фильтрации заявок' });
    }
});

router.get('/export', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT z.id, u.name, v.vnaim, z.kolich, z.status, z.data_start, z.data_end, z.created_at
            FROM ZayavkaSn z
            JOIN users u ON z.user_id = u.id
            JOIN VidSn v ON z.id_vid = v.id_vid
        `);

        const csv = stringify(rows, { header: true, delimiter: ';' });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="requests.csv"');
        res.send(csv);

    } catch (error) {
        console.error('Ошибка экспорта:', error);
        res.status(500).json({ message: 'Ошибка экспорта заявок' });
    }
});

router.post('/requests', verifyToken, async (req, res) => {
    try {
        const {
            id_vid,
            kolich,
            data_start,
            data_end
        } = req.body;
        const { user } = req;

        const now = new Date();
        const start = data_start || now.toISOString().split('T')[0];
        const end = data_end || start;

        await pool.execute(`
            INSERT INTO ZayavkaSn (user_id, id_vid, kolich, data_start, data_end)
            VALUES (?, ?, ?, ?, ?)
        `, [user.id, id_vid, kolich, start, end]);

        const [[created]] = await pool.execute(`SELECT LAST_INSERT_ID() as id`);
        res.status(201).json({ id: created.id });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка создания заявки' });
    }
});

router.get('/requests', verifyToken, async (req, res) => {
    try {
        const { limit = 5, user_id } = req.query;
        const [rows] = await pool.execute(`
            SELECT z.*, v.vnaim
            FROM ZayavkaSn z
            JOIN VidSn v ON v.id_vid = z.id_vid
            WHERE z.user_id = ?
            ORDER BY z.id DESC
            LIMIT ?
        `, [user_id, Number(limit)]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка получения заявок' });
    }
});

router.patch('/requests/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { kolich } = req.body;
        const { user } = req;

        const [[zayavka]] = await pool.execute(`SELECT * FROM ZayavkaSn WHERE id = ?`, [id]);

        if (!zayavka) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }
        if (zayavka.user_id !== user.id) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }
        if (zayavka.status !== 'на рассмотрении') {
            return res.status(400).json({ message: 'Редактирование запрещено' });
        }

        await pool.execute(`UPDATE ZayavkaSn SET kolich = ? WHERE id = ?`, [kolich, id]);
        res.json({ message: 'Заявка обновлена' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка обновления заявки' });
    }
});

router.delete('/requests/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {user} = req;

        const [[zayavka]] = await pool.execute(`SELECT * FROM ZayavkaSn WHERE id = ?`, [id]);

        if (!zayavka) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }
        if (zayavka.user_id !== user.id) {
            return res.status(403).json({ message: 'Доступ запрещён' });
        }
        if (zayavka.status !== 'на рассмотрении') {
            return res.status(400).json({ message: 'Удаление запрещено' });
        }

        await pool.execute(`DELETE FROM ZayavkaSn WHERE id = ?`, [id]);
        res.json({ message: 'Заявка удалена' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка удаления заявки' });
    }
});

export default router;
