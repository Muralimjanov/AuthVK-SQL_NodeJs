import { findUserByVkId, createUser } from '../Models/UserModel.js';
import { fetchVkUserInfo, isValidSignature } from '../utils/vkApi.js';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function vkAuth(req, res) {
    const { vk_user_id, sign, is_group_creator, bypass_signature } = req.body;

    if (!vk_user_id || !sign) {
        return res.status(400).json({ message: 'Отсутствуют параметры' });
    }

    if (!bypass_signature && !isValidSignature(req.body)) {
        return res.status(403).json({ message: 'Неверная подпись' });
    }

    let user = await findUserByVkId(vk_user_id);

    if (!user) {
        const vkUser = await fetchVkUserInfo(vk_user_id);
        const full_name = `${vkUser.first_name} ${vkUser.last_name}`;
        const role_id = is_group_creator ? 2 : 1;

        const userId = await createUser({ vk_id: vk_user_id, full_name, role_id });
        user = { id_user: userId, id_vk: vk_user_id, fio: full_name, id_rol: role_id };
    } else {
        user = { id_user: user.id_user, id_vk: user.id_vk, fio: user.fio, id_rol: user.id_rol };
    }

    const token = jwt.sign(
        { id_user: user.id_user, id_vk: user.id_vk, id_rol: user.id_rol },
        SECRET,
        { expiresIn: '1h' }
    );

    const tabs = user.id_rol === 2
        ? ['Заявки', 'Список снаряжения', 'Администрирование снаряжения', 'Администрирование заявок', 'Администрирование пользователей']
        : ['Заявки', 'Список снаряжения'];

    return res.json({
        message: 'Авторизация успешна',
        user,
        token,
        tabs
    });
}