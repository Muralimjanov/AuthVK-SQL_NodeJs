import pool from '../Models/database.js';

export async function autoReturnOverdue() {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM ZayavkaSn 
            WHERE data_end < CURDATE() AND status = 'выдан'
        `);

        for (const row of rows) {
            await pool.execute(`UPDATE ZayavkaSn SET status = 'возвращён' WHERE id = ?`, [row.id]);
            await pool.execute(`UPDATE VidSn SET kolich = kolich + ? WHERE id_vid = ?`, [row.kolich, row.id_vid]);
            console.log(`Авто-возврат заявки ID ${row.id}`);
        }

    } catch (err) {
        console.error('Ошибка авто-возврата:', err);
    }
}
