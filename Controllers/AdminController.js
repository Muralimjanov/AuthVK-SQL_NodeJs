import pool from '../Models/database.js';

export async function getUsers(req, res) {
    const { sort = 'id_user' } = req.query;
    const [users] = await pool.execute(`SELECT * FROM Users ORDER BY ${pool.escapeId(sort)}`);
    res.json(users);
}

export async function updateUser(req, res) {
    const { id } = req.params;
    const allowed = ['vk_id', 'id_rol', 'fio'];
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
    await pool.execute(`UPDATE Users SET ${fields.join(', ')} WHERE id_user = ?`, values);
    res.json({ message: 'Пользователь обновлён' });
}

export async function deleteUser(req, res) {
    const { id } = req.params;

    try {
        const [zajavRows] = await pool.execute('SELECT COUNT(*) as count FROM Zajav WHERE id_user = ?', [id]);
        if (zajavRows[0].count > 0) {
            return res.status(400).json({ message: 'Невозможно удалить пользователя: есть связанные заявки. Удалите или перенесите заявки сначала.' });
        }

        await pool.execute('DELETE FROM Users WHERE id_user = ?', [id]);
        res.json({ message: 'Удалено' });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ message: 'Ошибка удаления пользователя' });
    }
}

export async function getRequests(req, res) {
    const { sort = 'id_zajav' } = req.query;
    const [rows] = await pool.execute(`
        SELECT z.*, u.fio AS user_name
        FROM Zajav z
        JOIN Users u ON z.id_user = u.id_user
        ORDER BY z.${pool.escapeId(sort)} DESC
    `);
    res.json(rows);
}

export async function getRequestItems(req, res) {
    const [rows] = await pool.execute(`
        SELECT z.*, v.vnaim 
        FROM Zajav z 
        JOIN VidSn v ON v.id_vid = z.id_vid 
        WHERE z.id_zajav = ?`,
        [req.params.id]
    );
    res.json(rows[0] || {});
}

export async function updateRequest(req, res) {
    const { id } = req.params;
    const { fio, status, data_start, data_end } = req.body;

    await pool.execute(
        `UPDATE Zajav SET fio = ?, id_status = ?, datas = ?, datapo = ? WHERE id_zajav = ?`,
        [fio, status, data_start, data_end, id]
    );
    res.json({ message: 'Заявка обновлена' });
}

export async function addRequestItem(req, res) {
    const { id } = req.params;
    const { id_vid, kolich, data_start, data_end } = req.body;
    const now = new Date().toISOString().split('T')[0];

    await pool.execute(
        `INSERT INTO Zajav (id_user, id_vid, kolich, datas, datapo, id_status) 
        VALUES ((SELECT id_user FROM Zajav WHERE id_zajav = ?), ?, ?, ?, ?, '1')`,
        [id, id_vid, kolich, data_start || now, data_end || now]
    );
    res.status(201).json({ message: 'Элемент добавлен' });
}

export async function deleteRequest(req, res) {
    await pool.execute(`DELETE FROM Zajav WHERE id_zajav = ?`, [req.params.id]);
    res.json({ message: 'Удалена заявка' });
}

export async function printRequest(req, res) {
    const { id } = req.params;
    await pool.execute(`UPDATE Zajav SET printed = 1 WHERE id_zajav = ?`, [id]);
    res.json({ message: 'Печать выполнена (заглушка)' });
}

export async function getCategories(req, res) {
    const { sort = 'id_tip' } = req.query;
    const [rows] = await pool.execute(`SELECT id_tip, tnaim FROM TipSn ORDER BY ${pool.escapeId(sort)}`);
    res.json(rows);
}

export async function getStatuses(req, res) {
    try {
        const [statuses] = await pool.execute('SELECT DISTINCT id_status, status_name FROM Status');
        res.json(statuses);
    } catch (error) {
        console.error('Ошибка получения статусов:', error);
        res.status(500).json({ message: 'Ошибка загрузки статусов: ' + error.message });
    }
}