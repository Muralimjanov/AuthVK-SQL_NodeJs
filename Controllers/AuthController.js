import { findUserByVkId, createUser } from '../Models/UserModel.js';
import { fetchVkUserInfo, isValidSignature } from '../utils/vkApi.js';

export async function vkAuth(req, res) {
    const { vk_user_id, sign, is_group_creator } = req.body;

    if (!vk_user_id || !sign) {
        return res.status(400).json({ message: 'Отсутствуют параметры' });
    }

    if (!isValidSignature(req.body)) {
        return res.status(403).json({ message: 'Неверная подпись' });
    }

    let user = await findUserByVkId(vk_user_id);

    if (!user) {
        const vkUser = await fetchVkUserInfo(vk_user_id);
        const full_name = `${vkUser.first_name} ${vkUser.last_name}`;
        const role = is_group_creator ? 'Заведующий' : 'Арендатор';

        const userId = await createUser({ vk_id: vk_user_id, full_name, role });
        user = { id: userId, vk_id: vk_user_id, full_name, role };
    }

    const tabs = user.role === 'Заведующий'
        ? ['Заявки', 'Список снаряжения', 'Администрирование снаряжения', 'Администрирование заявок', 'Администрирование пользователей']
        : ['Заявки', 'Список снаряжения'];

    return res.json({
        message: 'Авторизация успешна',
        user,
        tabs
    });
}
