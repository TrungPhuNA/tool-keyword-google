require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.WEB_PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Khởi tạo database
const db = new Database();

// Routes

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Lấy tất cả keywords
app.get('/api/keywords', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const processed = req.query.processed;

        let query = 'SELECT * FROM keywords';
        let countQuery = 'SELECT COUNT(*) as total FROM keywords';
        let queryParams = [];
        let countParams = [];
        let conditions = [];

        // Thêm điều kiện tìm kiếm
        if (search) {
            conditions.push('keyword LIKE ?');
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        if (processed !== undefined) {
            conditions.push('processed = ?');
            const processedValue = processed === 'true' ? 1 : 0;
            queryParams.push(processedValue);
            countParams.push(processedValue);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // Thêm sắp xếp và phân trang
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, (page - 1) * limit);

        const [keywords] = await db.connection.execute(query, queryParams);
        const [countResult] = await db.connection.execute(countQuery, countParams);

        res.json({
            keywords,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi lấy keywords:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API: Lấy thống kê
app.get('/api/statistics', async (req, res) => {
    try {
        const stats = await db.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Lỗi lấy thống kê:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API: Thêm keyword mới
app.post('/api/keywords', async (req, res) => {
    try {
        const { keyword, source_keyword } = req.body;
        
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword không được để trống' });
        }
        
        const isNew = await db.addKeyword(keyword, source_keyword);
        
        if (isNew) {
            res.json({ message: 'Thêm keyword thành công', keyword });
        } else {
            res.status(409).json({ error: 'Keyword đã tồn tại' });
        }
    } catch (error) {
        console.error('Lỗi thêm keyword:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API: Cập nhật keyword
app.put('/api/keywords/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { keyword, source_keyword, processed } = req.body;
        
        const query = `
            UPDATE keywords 
            SET keyword = ?, source_keyword = ?, processed = ?
            WHERE id = ?
        `;
        
        const [result] = await db.connection.execute(query, [
            keyword,
            source_keyword,
            processed ? 1 : 0,
            id
        ]);
        
        if (result.affectedRows > 0) {
            res.json({ message: 'Cập nhật thành công' });
        } else {
            res.status(404).json({ error: 'Không tìm thấy keyword' });
        }
    } catch (error) {
        console.error('Lỗi cập nhật keyword:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API: Xóa keyword
app.delete('/api/keywords/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM keywords WHERE id = ?';
        const [result] = await db.connection.execute(query, [id]);
        
        if (result.affectedRows > 0) {
            res.json({ message: 'Xóa thành công' });
        } else {
            res.status(404).json({ error: 'Không tìm thấy keyword' });
        }
    } catch (error) {
        console.error('Lỗi xóa keyword:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API: Xóa nhiều keywords
app.delete('/api/keywords', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
        }
        
        const placeholders = ids.map(() => '?').join(',');
        const query = `DELETE FROM keywords WHERE id IN (${placeholders})`;
        
        const [result] = await db.connection.execute(query, ids);
        
        res.json({ 
            message: `Đã xóa ${result.affectedRows} keywords`,
            deletedCount: result.affectedRows
        });
    } catch (error) {
        console.error('Lỗi xóa nhiều keywords:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API: Reset tất cả keywords về chưa xử lý
app.post('/api/keywords/reset', async (req, res) => {
    try {
        const query = 'UPDATE keywords SET processed = 0';
        const [result] = await db.connection.execute(query);

        res.json({
            message: `Đã reset ${result.affectedRows} keywords về trạng thái chưa xử lý`,
            resetCount: result.affectedRows
        });
    } catch (error) {
        console.error('Lỗi reset keywords:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🌐 Web server đang chạy tại http://localhost:${PORT}`);
    console.log(`📊 Truy cập để quản lý keywords`);
});

// Xử lý tín hiệu dừng
process.on('SIGINT', async () => {
    console.log('\n🛑 Đang dừng web server...');
    await db.close();
    process.exit(0);
});
