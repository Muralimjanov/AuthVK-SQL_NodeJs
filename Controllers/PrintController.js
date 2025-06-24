import PDFDocument from 'pdfkit';
import fs from 'fs';

export async function generateActReception(req, res) {
    const { application, equipment } = req.body;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="act_reception.pdf"');
    doc.pipe(res);

    // Логотип (замените на реальный путь или URL)
    // doc.image('path/to/logo.png', 50, 50, { width: 100 }); // Раскомментируйте и укажите путь
    doc.moveDown();

    doc.fontSize(16).text('Акт приема оборудования', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`№ ${application?.id || '___'} от ${application?.date || '___'}`, { align: 'center' });
    doc.text('г. Москва', { align: 'center' }).moveDown(2);

    doc.text(`Арендодатель: ООО "Прокат Клуб", ИНН 1234567890, КПП 123456789, адрес: г. Москва, ул. Примерная, д. 1, тел.: +7 (495) 123-45-67`);
    doc.text(`Арендатор: ${application?.userFullName || '___'}, паспорт: серия ____ № ____, выдан ________________, адрес регистрации: ________________`).moveDown();

    const tableTop = 200;
    doc.fontSize(12).text('Арендатор вернул, а Арендодатель принял следующее оборудование:', tableTop - 20);
    doc.moveTo(50, tableTop).lineTo(550, tableTop).stroke();
    doc.text('№', 50, tableTop + 10).text('Наименование', 80).text('Кол-во', 200).text('Стоимость проката (₽/день)', 250).text('Залог (₽)', 350).text('Примечание', 450);
    let y = tableTop + 30;
    equipment.forEach((item, index) => {
        doc.text(`${index + 1}`, 50, y).text(item.vnaim, 80).text(`${item.kolich}`, 200).text(`${item.zenapr}`, 250).text(`${item.zenaz}`, 350).text(item.sost || '', 450);
        y += 20;
    });

    const totalRental = equipment.reduce((sum, item) => sum + (item.zenapr || 0) * (item.kolich || 0), 0);
    const totalDeposit = equipment.reduce((sum, item) => sum + (item.zenaz || 0) * (item.kolich || 0), 0);
    doc.text(`Итого: Стоимость проката: ${totalRental} ₽/день, Залог: ${totalDeposit} ₽`, 50, y + 20).moveDown();

    doc.moveDown(4).text('Арендодатель:', 50).text('________________ / ________________', 50, y + 120);
    doc.text('Арендатор:', 350).text(`________________ / ${application?.userFullName || '___'}`, 350, y + 120);

    doc.text('Примечание: Оборудование возвращено в исправном состоянии, за исключением нормального износа. Претензий у сторон нет.', 50, y + 150, { fontSize: 10 });

    doc.end();
}

export async function generateActTransmission(req, res) {
    const { application, equipment } = req.body;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="act_transmission.pdf"');
    doc.pipe(res);

    // Логотип (замените на реальный путь или URL)
    // doc.image('path/to/logo.png', 50, 50, { width: 100 }); // Раскомментируйте и укажите путь
    doc.moveDown();

    doc.fontSize(16).text('Акт передачи оборудования', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`№ ${application?.id || '___'} от ${application?.date || '___'}`, { align: 'center' });
    doc.text('г. Москва', { align: 'center' }).moveDown(2);

    doc.text(`Арендодатель: ООО "Прокат Клуб", ИНН 1234567890, КПП 123456789, адрес: г. Москва, ул. Примерная, д. 1, тел.: +7 (495) 123-45-67`);
    doc.text(`Арендатор: ${application?.userFullName || '___'}, паспорт: серия ____ № ____, выдан ________________, адрес регистрации: ________________`).moveDown();

    const tableTop = 200;
    doc.fontSize(12).text('Арендодатель передал, а Арендатор принял следующее оборудование в аренду:', tableTop - 20);
    doc.moveTo(50, tableTop).lineTo(550, tableTop).stroke();
    doc.text('№', 50, tableTop + 10).text('Наименование', 80).text('Кол-во', 200).text('Стоимость проката (₽/день)', 250).text('Залог (₽)', 350).text('Примечание', 450);
    let y = tableTop + 30;
    equipment.forEach((item, index) => {
        doc.text(`${index + 1}`, 50, y).text(item.vnaim, 80).text(`${item.kolich}`, 200).text(`${item.zenapr}`, 250).text(`${item.zenaz}`, 350).text(item.sost || '', 450);
        y += 20;
    });

    const totalRental = equipment.reduce((sum, item) => sum + (item.zenapr || 0) * (item.kolich || 0), 0);
    const totalDeposit = equipment.reduce((sum, item) => sum + (item.zenaz || 0) * (item.kolich || 0), 0);
    doc.text(`Итого: Стоимость проката: ${totalRental} ₽/день, Залог: ${totalDeposit} ₽`, 50, y + 20).moveDown();

    doc.moveDown(4).text('Арендодатель:', 50).text('________________ / ________________', 50, y + 120);
    doc.text('Арендатор:', 350).text(`________________ / ${application?.userFullName || '___'}`, 350, y + 120);

    doc.text('Примечание: Оборудование передано в исправном состоянии. Арендатор обязуется вернуть оборудование в том же состоянии, за исключением нормального износа.', 50, y + 150, { fontSize: 10 });

    doc.end();
}