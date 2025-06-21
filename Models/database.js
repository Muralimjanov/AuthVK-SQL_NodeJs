import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '***' : 'НЕТ ПАРОЛЯ',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'vk_equipment_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Подключение к БД успешно');
        connection.release();
    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error.message);
    }
}

testConnection();

export default pool;
