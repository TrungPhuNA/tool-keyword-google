require('dotenv').config();
const Database = require('./database');
const GoogleScraper = require('./scraper');

class KeywordSEOTool {
    constructor() {
        this.db = new Database();
        this.scraper = new GoogleScraper();
        this.isRunning = false;
        this.processedCount = 0;
        this.maxDepth = parseInt(process.env.MAX_DEPTH) || 3; // Giới hạn độ sâu để tránh vòng lặp vô tận
        this.currentDepth = 0;
        this.delay = parseInt(process.env.SEARCH_DELAY) || 3000; // Delay giữa các lần tìm kiếm
    }

    async start(initialKeyword = "Code đồ án") {
        try {
            console.log('🚀 Bắt đầu thu thập từ khóa SEO...');
            console.log(`📝 Từ khóa ban đầu: "${initialKeyword}"`);
            
            await this.scraper.init();
            
            // Thêm từ khóa ban đầu vào database
            await this.db.addKeyword(initialKeyword);
            
            this.isRunning = true;
            await this.processKeywords();
            
        } catch (error) {
            console.error('❌ Lỗi trong quá trình chạy:', error);
        } finally {
            await this.cleanup();
        }
    }

    async processKeywords() {
        while (this.isRunning && this.currentDepth < this.maxDepth) {
            // Lấy từ khóa chưa được xử lý
            const unprocessedKeywords = await this.db.getUnprocessedKeywords();
            
            if (unprocessedKeywords.length === 0) {
                console.log('✅ Không còn từ khóa nào để xử lý');
                break;
            }

            console.log(`\n🔄 Độ sâu ${this.currentDepth + 1}/${this.maxDepth}`);
            console.log(`📊 Còn ${unprocessedKeywords.length} từ khóa chưa xử lý`);

            for (const keywordData of unprocessedKeywords) {
                if (!this.isRunning) break;

                const keyword = keywordData.keyword;
                console.log(`\n🔍 Đang xử lý: "${keyword}"`);

                try {
                    // Tìm kiếm và thu thập từ khóa liên quan
                    const relatedKeywords = await this.scraper.searchKeyword(keyword);
                    
                    let newKeywordsCount = 0;
                    
                    // Thêm từ khóa mới vào database
                    for (const relatedKeyword of relatedKeywords) {
                        const isNew = await this.db.addKeyword(relatedKeyword, keyword);
                        if (isNew) {
                            newKeywordsCount++;
                            console.log(`  ➕ Thêm mới: "${relatedKeyword}"`);
                        }
                    }
                    
                    // Đánh dấu từ khóa đã được xử lý
                    await this.db.markAsProcessed(keyword);
                    this.processedCount++;
                    
                    console.log(`  ✅ Hoàn thành. Tìm thấy ${newKeywordsCount} từ khóa mới`);
                    console.log(`  📈 Đã xử lý: ${this.processedCount} từ khóa`);
                    
                    // Delay để tránh bị Google chặn
                    if (this.delay > 0) {
                        console.log(`  ⏳ Chờ ${this.delay/1000} giây...`);
                        await this.sleep(this.delay);
                    }
                    
                } catch (error) {
                    console.error(`  ❌ Lỗi xử lý từ khóa "${keyword}":`, error.message);
                    // Vẫn đánh dấu là đã xử lý để tránh lặp lại
                    await this.db.markAsProcessed(keyword);
                }
            }
            
            this.currentDepth++;
        }
        
        console.log('\n🎉 Hoàn thành thu thập từ khóa!');
        await this.showStatistics();
    }

    async showStatistics() {
        try {
            const stats = await this.db.getStatistics();
            const allKeywords = await this.db.getAllKeywords();

            console.log('\n📊 THỐNG KÊ:');
            console.log(`  📝 Tổng số từ khóa: ${stats.total}`);
            console.log(`  ✅ Đã xử lý: ${stats.processed}`);
            console.log(`  ⏳ Chưa xử lý: ${stats.unprocessed}`);
            console.log(`  🔄 Độ sâu đạt được: ${this.currentDepth}/${this.maxDepth}`);

            console.log('\n📋 DANH SÁCH TỪ KHÓA MỚI NHẤT:');
            const recentKeywords = allKeywords.slice(0, 10);
            recentKeywords.forEach((k, index) => {
                const status = k.processed ? '✅' : '⏳';
                console.log(`  ${index + 1}. ${status} "${k.keyword}"`);
            });
        } catch (error) {
            console.error('Lỗi hiển thị thống kê:', error);
        }
    }

    async stop() {
        console.log('\n🛑 Đang dừng tool...');
        this.isRunning = false;
    }

    async cleanup() {
        await this.scraper.close();
        await this.db.close();
        console.log('🧹 Đã dọn dẹp tài nguyên');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Xử lý tín hiệu dừng
process.on('SIGINT', async () => {
    console.log('\n🛑 Nhận tín hiệu dừng...');
    if (global.keywordTool) {
        await global.keywordTool.stop();
    }
    process.exit(0);
});

// Chạy tool
async function main() {
    const tool = new KeywordSEOTool();
    global.keywordTool = tool;
    
    // Lấy từ khóa từ command line hoặc sử dụng mặc định
    const initialKeyword = process.argv[2] || "Code đồ án";
    
    await tool.start(initialKeyword);
}

// Chạy nếu file này được gọi trực tiếp
if (require.main === module) {
    main().catch(console.error);
}

module.exports = KeywordSEOTool;
