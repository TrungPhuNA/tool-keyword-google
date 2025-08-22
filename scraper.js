const puppeteer = require('puppeteer');

class GoogleScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 Khởi tạo browser...');

        // Sử dụng cấu hình đơn giản giống simple-test
        console.log('📱 Khởi động browser...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox']
        });

        console.log('📄 Tạo trang mới...');
        this.page = await this.browser.newPage();

        // Cấu hình đơn giản
        this.page.setDefaultNavigationTimeout(30000);
        this.page.setDefaultTimeout(15000);

        console.log('✅ Browser đã khởi tạo thành công');
        console.log('🌐 Browser sẽ mở và KHÔNG tự động đóng');
    }

    async searchKeyword(keyword) {
        try {
            console.log(`🔍 Đang tìm kiếm từ khóa: "${keyword}"`);

            if (!this.page) {
                throw new Error('Page chưa được khởi tạo');
            }

            // Đơn giản hóa - chỉ dùng Google
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;

            console.log(`� Truy cập: ${searchUrl}`);

            // Truy cập trực tiếp search URL
            await this.page.goto(searchUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            const currentUrl = this.page.url();
            const title = await this.page.title();

            console.log(`📍 URL hiện tại: ${currentUrl}`);
            console.log(`📄 Title: ${title}`);

            // Kiểm tra có load thành công không
            if (currentUrl.includes('about:blank')) {
                console.log('❌ Không thể truy cập Google search');
                return [];
            }

            // Screenshot để xem
            await this.page.screenshot({ path: 'debug-search-result.png', fullPage: true });
            console.log('📸 Screenshot: debug-search-result.png');

            // Chờ trang load
            console.log('⏳ Chờ trang load...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Scroll xuống
            console.log('📜 Scroll xuống...');
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Screenshot sau scroll
            await this.page.screenshot({ path: 'debug-after-scroll.png', fullPage: true });
            console.log('📸 Screenshot sau scroll: debug-after-scroll.png');

            // Tìm từ khóa liên quan
            const relatedKeywords = await this.extractRelatedKeywords();

            console.log(`🎯 Tìm thấy ${relatedKeywords.length} từ khóa liên quan`);
            return relatedKeywords;

        } catch (error) {
            console.error(`❌ Lỗi khi tìm kiếm:`, error.message);

            // Screenshot khi có lỗi
            try {
                await this.page.screenshot({ path: 'debug-error.png', fullPage: true });
                console.log('📸 Screenshot lỗi: debug-error.png');
            } catch (screenshotError) {
                console.log('Không thể chụp screenshot');
            }

            return [];
        }
    }

    async extractRelatedKeywords() {
        try {
            console.log('🔍 Đang tìm phần "Mọi người cũng tìm kiếm"...');

            // Kiểm tra URL và title hiện tại
            const currentUrl = this.page.url();
            const title = await this.page.title();
            console.log(`📍 URL trong extract: ${currentUrl}`);
            console.log(`📄 Title trong extract: ${title}`);

            // Kiểm tra xem có phải trang search không
            const isSearchPage = currentUrl.includes('google.com/search') ||
                                currentUrl.includes('duckduckgo.com') ||
                                currentUrl.includes('bing.com/search');

            if (!isSearchPage) {
                console.log('⚠️  Không phải trang search!');
                return [];
            }

            console.log('✅ Đây là trang search hợp lệ');

            // Chờ trang load hoàn toàn
            await new Promise(resolve => setTimeout(resolve, 3000));

            let keywords = [];

            // Debug: Lấy một số text để xem trang có nội dung gì
            const pageText = await this.page.evaluate(() => {
                return document.body.innerText.substring(0, 500);
            });
            console.log('📄 Nội dung trang (500 ký tự đầu):', pageText);

            // Phương pháp đơn giản: Tìm tất cả text có chứa từ khóa liên quan
            console.log('📋 Đang quét tất cả text trên trang...');

            const allText = await this.page.evaluate(() => {
                const results = [];

                // Lấy tất cả text nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim();
                    if (text.length > 5 && text.length < 100) {
                        results.push(text);
                    }
                }

                return results;
            });

            console.log(`📄 Tìm thấy ${allText.length} đoạn text`);

            // Lọc text có chứa từ khóa liên quan
            const keywordPatterns = [
                /mua.*code/i,
                /mua.*đồ án/i,
                /code.*web/i,
                /đồ án.*java/i,
                /đồ án.*android/i,
                /đồ án.*spring/i,
                /source.*code/i,
                /thuê.*làm/i,
                /web.*bán/i,
                /java.*swing/i,
                /spring.*boot/i,
                /android.*studio/i
            ];

            for (const text of allText) {
                const cleanText = text.trim();

                // Bỏ qua text không mong muốn
                if (cleanText.toLowerCase().includes('mọi người') ||
                    cleanText.toLowerCase().includes('tìm kiếm') ||
                    cleanText.length < 5) {
                    continue;
                }

                // Kiểm tra pattern
                const hasPattern = keywordPatterns.some(pattern => pattern.test(cleanText));

                if (hasPattern) {
                    console.log(`✅ Tìm thấy từ khóa: "${cleanText}"`);
                    keywords.push(cleanText);
                }
            }

            // Nếu không tìm thấy bằng pattern, thử tìm từ URL
            if (keywords.length === 0) {
                console.log('📋 Tìm từ URL của các links...');

                const searchLinks = await this.page.$$eval('a[href*="/search?q="]', links => {
                    return links.map(link => {
                        try {
                            const url = new URL(link.href);
                            return decodeURIComponent(url.searchParams.get('q') || '');
                        } catch {
                            return '';
                        }
                    }).filter(q => q.length > 0);
                });

                console.log(`🔗 Tìm thấy ${searchLinks.length} search links`);

                for (const keyword of searchLinks) {
                    if (keyword.length > 3 && keyword.length < 100) {
                        console.log(`✅ Từ URL: "${keyword}"`);
                        keywords.push(keyword);
                    }
                }
            }

            // Làm sạch kết quả
            keywords = [...new Set(keywords)]
                .filter(kw => kw && kw.length > 3 && kw.length < 100)
                .map(kw => kw.trim())
                .filter(kw => kw.length > 0)
                .slice(0, 8); // Giới hạn 8 từ khóa

            console.log(`🎯 Kết quả cuối cùng: ${keywords.length} từ khóa`);
            keywords.forEach((kw, index) => {
                console.log(`  ${index + 1}. "${kw}"`);
            });

            return keywords;

        } catch (error) {
            console.error('❌ Lỗi khi trích xuất từ khóa:', error.message);
            return [];
        }
    }

    async close() {
        if (this.browser) {
            // Không đóng browser để user có thể xem tiến trình
            console.log('🌐 Browser vẫn đang mở để bạn có thể theo dõi tiến trình');
            console.log('⚠️  KHÔNG ĐÓNG browser này - nó sẽ tiếp tục được sử dụng');
            console.log('🛑 Nhấn Ctrl+C trong terminal để thoát hoàn toàn');
            // await this.browser.close();
        }
    }
}

module.exports = GoogleScraper;
