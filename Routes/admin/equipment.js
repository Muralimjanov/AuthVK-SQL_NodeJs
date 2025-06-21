import { Router } from 'express';
import { requireRole, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
import pool from '../../Models/database.js';

const router = Router();

// 🔐 Безопасное удаление (пример)
router.post('/secure-delete', requireRole('Заведующий'), async (req, res) => {
    // TODO: логика удаления
    res.json({ message: 'Удалено' });
});

// 📦 Получение списка всего снаряжения
router.get('/equipment', verifyAdmin, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT VidSn.*, TipSn.tnaim
        FROM VidSn
        LEFT JOIN TipSn ON VidSn.id_tip = TipSn.id_tip
        ORDER BY VidSn.id_vid
    `);
    res.json(rows);
});

// ✏️ Обновление строки снаряжения
router.patch('/equipment/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const allowedFields = ['vnaim', 'kolich', 'zenaz', 'zenapr', 'sost', 'id_tip'];
    const fields = [];
    const values = [];

    for (let key of allowedFields) {
        if (key in req.body) {
            fields.push(`${key} = ?`);
            values.push(req.body[key]);
        }
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Нет полей для обновления' });
    }

    values.push(id);
    await pool.execute(
        `UPDATE VidSn SET ${fields.join(', ')} WHERE id_vid = ?`,
        values
    );

    res.json({ message: 'Снаряжение обновлено' });
});

// 🗑 Удаление снаряжения
router.delete('/equipment/:id', verifyAdmin, async (req, res) => {
    await pool.execute(`DELETE FROM VidSn WHERE id_vid = ?`, [req.params.id]);
    res.json({ message: 'Удалено' });
});

// 👥 Получение пользователей
router.get('/users', verifyAdmin, async (req, res) => {
    const [users] = await pool.execute(`SELECT * FROM users ORDER BY id`);
    res.json(users);
});

// ✏️ Обновление пользователя
router.patch('/users/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const allowed = ['vk_id', 'role', 'name'];
    const fields = [];
    const values = [];

    for (let key of allowed) {
        if (key in req.body) {
            fields.push(`${key} = ?`);
            values.push(req.body[key]);
        }
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    values.push(id);
    await pool.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    res.json({ message: 'Пользователь обновлён' });
});

// 🗑 Удаление пользователя
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    await pool.execute(`DELETE FROM users WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Удалено' });
});

// 📄 Получение всех заявок
router.get('/requests', verifyAdmin, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT r.*, u.name AS user_name
        FROM requests r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
    `);
    res.json(rows);
});

// 📦 Содержимое заявки
router.get('/requests/:id/items', verifyAdmin, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT i.*, v.vnaim
        FROM request_items i
        JOIN VidSn v ON v.id_vid = i.id_vid
        WHERE i.request_id = ?
    `, [req.params.id]);
    res.json(rows);
});

// ✏️ Обновление заявки
router.patch('/requests/:id', verifyAdmin, async (req, res) => {
    const { fio, status, date_start, date_end } = req.body;

    await pool.execute(`
        UPDATE requests
        SET fio = ?, status = ?, date_start = ?, date_end = ?
        WHERE id = ?
    `, [fio, status, date_start, date_end, req.params.id]);

    res.json({ message: 'Заявка обновлена' });
});

// 🗑 Удаление заявки и содержимого
router.delete('/requests/:id', verifyAdmin, async (req, res) => {
    await pool.execute(`DELETE FROM requests WHERE id = ?`, [req.params.id]);
    await pool.execute(`DELETE FROM request_items WHERE request_id = ?`, [req.params.id]);
    res.json({ message: 'Удалена заявка и содержимое' });
});

// 🖨 Отметить печать заявки
router.post('/requests/:id/print', verifyAdmin, async (req, res) => {
    const { id } = req.params;

    // TODO: Генерация PDF или запись факта печати
    await pool.execute(`UPDATE requests SET printed = 1 WHERE id = ?`, [id]);
    res.json({ message: 'Печать выполнена (заглушка)' });
});

export default router;
