import pool from './database.js';

export async function findUserByVkId(vk_id) {
    const [rows] = await pool.execute(
        'SELECT * FROM Users WHERE id_vk = ?',
        [vk_id]
    );
    return rows[0] || null;
}

export async function createUser({ vk_id, full_name, role_id }) {
    const [result] = await pool.execute(
        'INSERT INTO Users (id_vk, fio, id_rol) VALUES (?, ?, ?)',
        [vk_id, full_name, role_id]
    );
    return result.insertId;
}