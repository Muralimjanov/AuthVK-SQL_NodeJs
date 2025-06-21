import crypto from 'crypto';

export function isValidSignature(params) {
    const secret = process.env.VK_SECRET;
    const ordered = Object.keys(params)
        .filter(k => k.startsWith('vk_'))
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('&');

    const sign = crypto
        .createHmac('sha256', secret)
        .update(ordered)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return sign === params.sign;
}

export function fetchVkUserInfo(vk_id) {
    return {
        id: vk_id,
        first_name: 'Имя',
        last_name: 'Фамилия'
    };
}
