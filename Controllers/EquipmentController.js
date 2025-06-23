import pool from '../Models/database.js';

export async function createEquipment(req, res) {
    try {
        const { id_tip, vnaim, kolich, zenaz, zenapr, sost } = req.body;
        if (!vnaim || kolich == null || zenaz == null || zenapr == null) {
            return res.status(400).json({ message: 'Поля vnaim, kolich, zenaz, zenapr обязательны' });
        }
        const [result] = await pool.execute(
            'INSERT INTO VidSn (id_tip, vnaim, kolich, zenaz, zenapr, sost) VALUES (?, ?, ?, ?, ?, ?)',
            [id_tip || null, vnaim, kolich, zenaz, zenapr, sost || null]
        );
        res.status(201).json({ message: 'Снаряжение добавлено', id_vid: result.insertId });
    } catch (error) {
        console.error('Ошибка добавления снаряжения:', error);
        res.status(500).json({ message: 'Ошибка добавления снаряжения: ' + error.message });
    }
}

export async function updateEquipment(req, res) {
    try {
        const { id } = req.params;
        const { id_tip, vnaim, kolich, zenaz, zenapr, sost } = req.body;
        if (!vnaim && kolich == null && zenaz == null && zenapr == null && !sost) {
            return res.status(400).json({ message: 'Хотя бы одно поле должно быть указано для обновления' });
        }
        const [result] = await pool.execute(
            'UPDATE VidSn SET id_tip = ?, vnaim = ?, kolich = ?, zenaz = ?, zenapr = ?, sost = ? WHERE id_vid = ?',
            [id_tip || null, vnaim || null, kolich || null, zenaz || null, zenapr || null, sost || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Снаряжение не найдено' });
        }
        res.json({ message: 'Снаряжение обновлено' });
    } catch (error) {
        console.error('Ошибка обновления снаряжения:', error);
        res.status(500).json({ message: 'Ошибка обновления снаряжения: ' + error.message });
    }
}

export async function deleteEquipment(req, res) {
    try {
        const { id } = req.params;

        const [dependentRows] = await pool.execute('SELECT COUNT(*) as count FROM DvSnar WHERE id_vid = ?', [id]);
        if (dependentRows[0].count > 0) {
            return res.status(400).json({ message: 'Нельзя удалить категорию: к ней привязано снаряжение.' });
        }

        const [result] = await pool.execute('DELETE FROM VidSn WHERE id_vid = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Категория не найдена' });
        }

        res.json({ message: 'Категория успешно удалена' });
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        res.status(500).json({ message: 'Ошибка удаления категории: ' + error.message });
    }
}

export async function getEquipmentWithAvailability(req, res) {
    try {
        const [equipment] = await pool.execute(`
            SELECT v.id_vid, v.vnaim, v.kolich AS total_quantity FROM VidSn v
        `);
        const [issuedItems] = await pool.execute(`
            SELECT d.id_vid, z.id_status, SUM(d.kolvo) AS total_issued
            FROM DvSnar d JOIN Zajav z ON z.id_zajav = d.id_zajav
            WHERE z.id_status IN ('на рассмотрении', 'предварительно оплачен', 'оплачен')
            GROUP BY d.id_vid, z.id_status
        `);
        const issuedMap = {};
        for (const item of issuedItems) {
            if (!issuedMap[item.id_vid]) issuedMap[item.id_vid] = {};
            issuedMap[item.id_vid][item.id_status] = item.total_issued || 0;
        }
        const result = equipment.map(eq => {
            const issued = issuedMap[eq.id_vid] || {};
            const totalIssuedAll = (issued['на рассмотрении'] || 0) + (issued['предварительно оплачен'] || 0) + (issued['оплачен'] || 0);
            const totalIssuedPaid = (issued['предварительно оплачен'] || 0) + (issued['оплачен'] || 0);
            const availability = eq.total_quantity - totalIssuedAll;
            const availabilityPaid = eq.total_quantity - totalIssuedPaid;
            let calendarStatus = 'green';
            if (availability <= 0) calendarStatus = 'yellow';
            if (availabilityPaid <= 0) calendarStatus = 'red';
            return { id_vid: eq.id_vid, vnaim: eq.vnaim, total_quantity: eq.total_quantity, availability, calendarStatus };
        });
        res.json(result);
    } catch (error) {
        console.error('Ошибка при загрузке снаряжения с доступностью:', error);
        res.status(500).json({ message: 'Ошибка загрузки снаряжения: ' + error.message });
    }
}

export async function getAllEquipment(req, res) {
    try {
        const [rows] = await pool.execute('SELECT * FROM VidSn ORDER BY id_vid');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка получения снаряжения' });
    }
}

export async function getEquipmentList(req, res) {
    try {
        console.log('Запрос списка снаряжения');
        const [equipment] = await pool.execute(`
            SELECT VidSn.id_vid, TipSn.tnaim, VidSn.vnaim, VidSn.kolich, VidSn.zenaz, VidSn.zenapr, VidSn.sost
            FROM VidSn LEFT JOIN TipSn ON VidSn.id_tip = TipSn.id_tip
        `);
        console.log(`Найдено ${equipment.length} единиц снаряжения`);
        res.json(equipment);
    } catch (error) {
        console.error('Ошибка получения снаряжения:', error);
        res.status(500).json({ message: 'Ошибка загрузки снаряжения: ' + error.message });
    }
}

export async function getEquipmentById(req, res) {
    try {
        const { id } = req.params;
        const [equipment] = await pool.execute(
            'SELECT VidSn.id_vid, VidSn.vnaim, VidSn.kolich, VidSn.zenaz, VidSn.zenapr, VidSn.sost FROM VidSn WHERE VidSn.id_vid = ?',
            [id]
        );
        if (equipment.length === 0) {
            return res.status(404).json({ message: 'Снаряжение не найдено' });
        }
        res.json(equipment[0]);
    } catch (error) {
        console.error('Ошибка получения снаряжения:', error);
        res.status(500).json({ message: 'Ошибка загрузки снаряжения: ' + error.message });
    }
}