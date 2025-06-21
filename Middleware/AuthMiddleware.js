import { findUserByVkId } from '../Models/UserModel.js';
import jwt from 'jsonwebtoken';


const SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function requireRole(role) {
    return async (req, res, next) => {
        const { vk_user_id } = req.body;

        if (!vk_user_id) {
            return res.status(401).json({ message: 'vk_user_id обязателен' });
        }

        const user = await findUserByVkId(vk_user_id);
        if (!user) {
            return res.status(403).json({ message: 'Пользователь не найден' });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: 'Недостаточно прав' });
        }

        req.user = user;
        next();
    };
}

export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ message: 'Нет токена' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Недействительный токен' });
    }
}

