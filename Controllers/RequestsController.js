import pool from '../Models/database.js';

export async function createRequest(req, res) {
    try {
        const { id_user, datas, datapo, summ, id_status, id_vid } = req.body;
        if (!id_user || !datas || !datapo || summ == null || !id_status) {
            return res.status(400).json({ message: 'Поля id_user, datas, datapo, summ, id_status обязательны' });
        }
        const startDate = new Date(datas);
        const endDate = new Date(datapo);
        if (isNaN(startDate) || isNaN(endDate) || endDate < startDate) {
            return res.status(400).json({ message: 'Неверный формат даты или дата окончания раньше даты начала' });
        }
        const [result] = await pool.execute(
            'INSERT INTO Zajav (id_user, datas, datapo, summ, id_status, id_vid) VALUES (?, ?, ?, ?, ?, ?)',
            [id_user, datas, datapo, summ, id_status, id_vid || null]
        );
        res.status(201).json({ message: 'Заявка создана', id_zajav: result.insertId });
    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        res.status(500).json({ message: 'Ошибка создания заявки: ' + error.message });
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
        res.status(500).json({ message: 'Ошибка получения заявок: ' + error.message });
    }
}

export async function patchRequest(req, res) {
    try {
        const { id } = req.params;
        const { id_user, datas, datapo, summ, id_status, id_vid } = req.body;
        if (!id_user && !datas && !datapo && summ == null && !id_status && !id_vid) {
            return res.status(400).json({ message: 'Хотя бы одно поле должно быть указано для обновления' });
        }
        if (datas || datapo) {
            const startDate = datas ? new Date(datas) : new Date();
            const endDate = datapo ? new Date(datapo) : new Date();
            if (isNaN(startDate) || isNaN(endDate) || endDate < startDate) {
                return res.status(400).json({ message: 'Неверный формат даты или дата окончания раньше даты начала' });
            }
        }
        const [result] = await pool.execute(
            'UPDATE Zajav SET id_user = ?, datas = ?, datapo = ?, summ = ?, id_status = ?, id_vid = ? WHERE id_zajav = ?',
            [id_user || null, datas || null, datapo || null, summ || null, id_status || null, id_vid || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }
        res.json({ message: 'Заявка обновлена' });
    } catch (error) {
        console.error('Ошибка обновления заявки:', error);
        res.status(500).json({ message: 'Ошибка обновления заявки: ' + error.message });
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
        console.error('Ошибка удаления заявки:', error);
        res.status(500).json({ message: 'Ошибка удаления заявки: ' + error.message });
    }
}