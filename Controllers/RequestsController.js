import pool from '../Models/database.js';

export async function addRequest(req, res) {
    const { user } = req;
    const { id_vid, kolich, data_start, data_end } = req.body;

    if (!user || !user.id_user) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
    }
    if (!id_vid || !kolich || !data_start || !data_end) {
        return res.status(400).json({ message: 'Отсутствуют обязательные параметры' });
    }

    try {
        await pool.execute(
            `INSERT INTO Zajav (id_user, id_vid, datas, datapo, summ) VALUES (?, ?, ?, ?, ?)`,
            [user.id_user, id_vid, data_start, data_end, kolich]
        );
        const [[{ id }]] = await pool.execute(`SELECT LAST_INSERT_ID() as id`);
        res.status(201).json({ id, message: 'Заявка создана' });
    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        res.status(500).json({ message: 'Ошибка создания заявки' });
    }
}
export async function getRecentRequests(req, res) {
    const { user } = req;
    if (!user || !user.id_user) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
    }
    try {
        const [rows] = await pool.execute(
            `SELECT z.*, v.vnaim 
            FROM Zajav z 
            JOIN VidSn v ON v.id_vid = z.id_vid 
            WHERE z.id_user = ? 
            ORDER BY z.id_zajav DESC 
            LIMIT 5`,
            [user.id_user]
        );
        res.json(rows);
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        res.status(500).json({ message: 'Ошибка получения заявок' });
    }
}
export async function updateRequest(req, res) {
    const { id } = req.params;
    const { kolich } = req.body;
    const { user } = req;

    try {
        const [[zayavka]] = await pool.execute(`SELECT * FROM Zajav WHERE id_zajav = ?`, [id]);
        if (!zayavka || zayavka.id_user !== user.id_user || (zayavka.id_status !== null && zayavka.id_status !== 1)) {
            return res.status(403).json({ message: 'Редактирование запрещено' });
        }
        await pool.execute(`UPDATE Zajav SET summ = ? WHERE id_zajav = ?`, [kolich, id]);
        res.json({ message: 'Заявка обновлена' });
    } catch (error) {
        console.error('Ошибка обновления заявки:', error);
        res.status(500).json({ message: 'Ошибка обновления заявки' });
    }
}

export async function deleteRequest(req, res) {
    const { id } = req.params;
    const { user } = req;

    try {
        const [[zayavka]] = await pool.execute(`SELECT * FROM Zajav WHERE id_zajav = ?`, [id]);
        if (!zayavka || zayavka.id_user !== user.id_user || zayavka.id_status !== 1) {
            return res.status(403).json({ message: 'Удаление запрещено' });
        }
        await pool.execute(`DELETE FROM Zajav WHERE id_zajav = ?`, [id]);
        res.json({ message: 'Заявка удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка удаления заявки' });
    }
}