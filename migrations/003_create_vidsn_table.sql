CREATE TABLE IF NOT EXISTS VidSn (
    id_vid INT AUTO_INCREMENT PRIMARY KEY,
    vnaim VARCHAR(255) NOT NULL,
    kolich INT NOT NULL,
    zenaz FLOAT,
    zenapr FLOAT,
    sost VARCHAR(255),
    id_tip INT,
    FOREIGN KEY (id_tip) REFERENCES TipSn(id_tip)
);