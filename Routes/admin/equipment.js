import { Router } from 'express';
import { requireRole } from '../../Middleware/AuthMiddleware.js';

const router = Router();

router.post('/secure-delete', requireRole('Заведующий'), async (req, res) => {
    // логика удаления
    res.json({ message: 'Удалено' });
});

router.get('/admin/equipment', verifyAdmin, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT VidSn.*, TipSn.tnaim
        FROM VidSn
        LEFT JOIN TipSn ON VidSn.id_tip = TipSn.id_tip
        ORDER BY VidSn.id_vid
    `);
    res.json(rows);
});

router.patch('/admin/equipment/:id', verifyAdmin, async (req, res) => {
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
    await pool.execute(`UPDATE VidSn SET ${fields.join(', ')} WHERE id_vid = ?`, values);
    res.json({ message: 'Снаряжение обновлено' });
});

router.delete('/admin/equipment/:id', verifyAdmin, async (req, res) => {
    await pool.execute(`DELETE FROM VidSn WHERE id_vid = ?`, [req.params.id]);
    res.json({ message: 'Удалено' });
});

router.get('/admin/users', verifyAdmin, async (req, res) => {
    const [users] = await pool.execute(`SELECT * FROM users ORDER BY id`);
    res.json(users);
});

router.patch('/admin/users/:id', verifyAdmin, async (req, res) => {
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
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Пользователь обновлён' });
});

router.delete('/admin/users/:id', verifyAdmin, async (req, res) => {
    await pool.execute(`DELETE FROM users WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Удалено' });
});

router.get('/admin/requests', verifyAdmin, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT r.*, u.name as user_name
        FROM requests r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
    `);
    res.json(rows);
});

router.get('/admin/requests/:id/items', verifyAdmin, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT i.*, v.vnaim
        FROM request_items i
        JOIN VidSn v ON v.id_vid = i.id_vid
        WHERE i.request_id = ?
    `, [req.params.id]);
    res.json(rows);
});

router.patch('/admin/requests/:id', verifyAdmin, async (req, res) => {
    const { fio, status, date_start, date_end } = req.body;
    await pool.execute(`
        UPDATE requests SET fio = ?, status = ?, date_start = ?, date_end = ?
        WHERE id = ?
    `, [fio, status, date_start, date_end, req.params.id]);
    res.json({ message: 'Заявка обновлена' });
});

router.delete('/admin/requests/:id', verifyAdmin, async (req, res) => {
    await pool.execute(`DELETE FROM requests WHERE id = ?`, [req.params.id]);
    await pool.execute(`DELETE FROM request_items WHERE request_id = ?`, [req.params.id]);
    res.json({ message: 'Удалена заявка и содержимое' });
});

router.post('/admin/requests/:id/print', verifyAdmin, async (req, res) => {
    const id = req.params.id;
    // TODO: Генерация PDF (например, через puppeteer или html-pdf)
    await pool.execute(`UPDATE requests SET printed = 1 WHERE id = ?`, [id]);
    res.json({ message: 'Печать выполнена (заглушка)' });
});

export default router;
