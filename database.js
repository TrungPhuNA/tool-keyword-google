const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.connection = null;
        this.init();
    }

    async init() {
        try {
            // Tạo kết nối MySQL
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'keyword_seo',
                charset: 'utf8mb4'
            });

            // Tạo bảng nếu chưa tồn tại
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS keywords (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    keyword VARCHAR(500) UNIQUE NOT NULL,
                    source_keyword VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE,
                    INDEX idx_keyword (keyword),
                    INDEX idx_processed (processed),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `;

            await this.connection.execute(createTableQuery);
            console.log('Database MySQL đã được khởi tạo');

        } catch (error) {
            console.error('Lỗi kết nối MySQL:', error);
            throw error;
        }
    }

    // Thêm từ khóa mới
    async addKeyword(keyword, sourceKeyword = null) {
        try {
            const query = `INSERT IGNORE INTO keywords (keyword, source_keyword) VALUES (?, ?)`;
            const [result] = await this.connection.execute(query, [keyword.trim(), sourceKeyword]);
            return result.affectedRows > 0; // true nếu thêm mới, false nếu đã tồn tại
        } catch (error) {
            console.error('Lỗi thêm từ khóa:', error);
            throw error;
        }
    }

    // Kiểm tra từ khóa đã tồn tại chưa
    async keywordExists(keyword) {
        try {
            const query = `SELECT COUNT(*) as count FROM keywords WHERE keyword = ?`;
            const [rows] = await this.connection.execute(query, [keyword.trim()]);
            return rows[0].count > 0;
        } catch (error) {
            console.error('Lỗi kiểm tra từ khóa:', error);
            throw error;
        }
    }

    // Lấy từ khóa chưa được xử lý
    async getUnprocessedKeywords() {
        try {
            const query = `SELECT * FROM keywords WHERE processed = 0 ORDER BY created_at ASC`;
            const [rows] = await this.connection.execute(query);
            return rows;
        } catch (error) {
            console.error('Lỗi lấy từ khóa chưa xử lý:', error);
            throw error;
        }
    }

    // Đánh dấu từ khóa đã được xử lý
    async markAsProcessed(keyword) {
        try {
            const query = `UPDATE keywords SET processed = 1 WHERE keyword = ?`;
            const [result] = await this.connection.execute(query, [keyword]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Lỗi đánh dấu từ khóa:', error);
            throw error;
        }
    }

    // Lấy tất cả từ khóa
    async getAllKeywords() {
        try {
            const query = `SELECT * FROM keywords ORDER BY created_at DESC`;
            const [rows] = await this.connection.execute(query);
            return rows;
        } catch (error) {
            console.error('Lỗi lấy tất cả từ khóa:', error);
            throw error;
        }
    }

    // Lấy thống kê
    async getStatistics() {
        try {
            const queries = [
                'SELECT COUNT(*) as total FROM keywords',
                'SELECT COUNT(*) as processed FROM keywords WHERE processed = 1',
                'SELECT COUNT(*) as unprocessed FROM keywords WHERE processed = 0'
            ];

            const [totalResult] = await this.connection.execute(queries[0]);
            const [processedResult] = await this.connection.execute(queries[1]);
            const [unprocessedResult] = await this.connection.execute(queries[2]);

            return {
                total: totalResult[0].total,
                processed: processedResult[0].processed,
                unprocessed: unprocessedResult[0].unprocessed
            };
        } catch (error) {
            console.error('Lỗi lấy thống kê:', error);
            throw error;
        }
    }

    // Đóng kết nối database
    async close() {
        try {
            if (this.connection) {
                await this.connection.end();
                console.log('Kết nối MySQL đã được đóng');
            }
        } catch (error) {
            console.error('Lỗi đóng kết nối MySQL:', error);
        }
    }
}

module.exports = Database;
