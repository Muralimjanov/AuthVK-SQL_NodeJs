import { findUserByVkId } from '../Models/UserModel.js';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function requireRole(role) {
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
        console.log('Decoded token:', decoded);
        req.user = {
            vk_id: decoded.id_vk,
            id_user: decoded.id_user,
            id_rol: decoded.id_rol
        };
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ message: 'Недействительный токен' });
    }
}

export async function verifyAdmin(req, res, next) {
    const { user } = req;
    console.log('User in verifyAdmin (raw):', user);
    console.log('User.vk_id type:', typeof user.vk_id, 'value:', user.vk_id);

    if (!user || typeof user.vk_id === 'undefined' || user.vk_id === null) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const dbUser = await findUserByVkId(user.vk_id);
    console.log('findUserByVkId result:', dbUser);
    if (!dbUser) {
        return res.status(403).json({ message: 'Пользователь не найден' });
    }

    if (dbUser.id_rol !== 2) {
        return res.status(403).json({ message: 'Только для заведующего' });
    }

    req.user = dbUser;
    next();
}