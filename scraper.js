const puppeteer = require('puppeteer');

class GoogleScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('Khởi tạo browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Để xem quá trình scraping
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent để tránh bị phát hiện
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('Browser đã được khởi tạo');
    }

    async searchKeyword(keyword) {
        try {
            console.log(`Đang tìm kiếm từ khóa: "${keyword}"`);
            
            // Truy cập Google
            await this.page.goto('https://www.google.com/', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Chờ và nhập từ khóa vào ô tìm kiếm
            await this.page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 10000 });
            await this.page.click('textarea[name="q"], input[name="q"]');
            await this.page.type('textarea[name="q"], input[name="q"]', keyword);
            
            // Nhấn Enter để tìm kiếm
            await this.page.keyboard.press('Enter');
            
            // Chờ kết quả tải
            await this.page.waitForSelector('#search', { timeout: 15000 });
            
            // Scroll xuống để tìm phần "Mọi người cũng tìm kiếm"
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            
            // Chờ một chút để nội dung tải
            await this.page.waitForTimeout(2000);
            
            // Tìm và thu thập từ khóa từ phần "Mọi người cũng tìm kiếm"
            const relatedKeywords = await this.extractRelatedKeywords();
            
            console.log(`Tìm thấy ${relatedKeywords.length} từ khóa liên quan`);
            return relatedKeywords;
            
        } catch (error) {
            console.error(`Lỗi khi tìm kiếm từ khóa "${keyword}":`, error.message);
            return [];
        }
    }

    async extractRelatedKeywords() {
        try {
            // Các selector có thể có cho phần "Mọi người cũng tìm kiếm"
            const selectors = [
                '[data-async-context*="related"] a',
                '[data-async-context*="people_also_search"] a',
                '.related-question-pair a',
                '.AuVD a',
                '[jsname="yEVEE"] a',
                '.s75CSd a'
            ];

            let keywords = [];

            for (const selector of selectors) {
                try {
                    const elements = await this.page.$$(selector);
                    
                    for (const element of elements) {
                        const text = await this.page.evaluate(el => el.textContent?.trim(), element);
                        if (text && text.length > 0 && text.length < 100) {
                            keywords.push(text);
                        }
                    }
                    
                    if (keywords.length > 0) {
                        break; // Nếu tìm thấy từ khóa thì dừng
                    }
                } catch (err) {
                    // Tiếp tục với selector tiếp theo
                    continue;
                }
            }

            // Thử tìm trong phần "People also ask"
            if (keywords.length === 0) {
                try {
                    const peopleAlsoAskElements = await this.page.$$('[jsname="yEVEE"] span, .related-question-pair span');
                    
                    for (const element of peopleAlsoAskElements) {
                        const text = await this.page.evaluate(el => el.textContent?.trim(), element);
                        if (text && text.length > 0 && text.length < 100) {
                            keywords.push(text);
                        }
                    }
                } catch (err) {
                    console.log('Không tìm thấy phần People also ask');
                }
            }

            // Loại bỏ trùng lặp và làm sạch dữ liệu
            keywords = [...new Set(keywords)]
                .filter(keyword => keyword && keyword.length > 2)
                .map(keyword => keyword.replace(/[""]/g, '').trim())
                .filter(keyword => keyword.length > 0);

            return keywords;
            
        } catch (error) {
            console.error('Lỗi khi trích xuất từ khóa liên quan:', error.message);
            return [];
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser đã được đóng');
        }
    }
}

module.exports = GoogleScraper;
