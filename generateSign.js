import crypto from "crypto";
const secret = '1234567';
const params = { vk_user_id: '123456789' };
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
console.log(sign);