-- Script tạo database và bảng cho Keyword SEO Tool

-- Tạo database
CREATE DATABASE IF NOT EXISTS keyword_seo 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Sử dụng database
USE keyword_seo;

-- Tạo bảng keywords
CREATE TABLE IF NOT EXISTS keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(500) UNIQUE NOT NULL,
    source_keyword VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    
    -- Tạo index để tối ưu performance
    INDEX idx_keyword (keyword),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at),
    INDEX idx_source_keyword (source_keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo user cho ứng dụng (tùy chọn)
-- CREATE USER 'keyword_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON keyword_seo.* TO 'keyword_user'@'localhost';
-- FLUSH PRIVILEGES;
