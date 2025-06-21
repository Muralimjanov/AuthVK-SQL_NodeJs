CREATE TABLE IF NOT EXISTS ZayavkaSn (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    id_vid INT NOT NULL,
    kolich INT NOT NULL,
    status ENUM(
        'на рассмотрении',
        'предварительно оплачен',
        'оплачен',
        'отклонён',
        'выдан',
        'возвращён'
    ) DEFAULT 'на рассмотрении',
    data_start DATE NOT NULL,
    data_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (id_vid) REFERENCES VidSn(id_vid)
);
