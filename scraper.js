const puppeteer = require('puppeteer');

class GoogleScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('Khởi tạo browser...');

        try {
            // Cấu hình browser với nhiều options để tránh lỗi
            const browserOptions = {
                headless: false, // Luôn hiển thị browser để xem tiến trình
                defaultViewport: null,
                ignoreDefaultArgs: ['--disable-extensions'],
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--remote-debugging-port=9222'
                ]
            };

            // Thử khởi tạo browser
            this.browser = await puppeteer.launch(browserOptions);

            this.page = await this.browser.newPage();

            // Cấu hình page
            await this.page.setDefaultNavigationTimeout(60000);
            await this.page.setDefaultTimeout(30000);

            // Set user agent để tránh bị phát hiện
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Set viewport
            await this.page.setViewport({
                width: 1366,
                height: 768,
                deviceScaleFactor: 1
            });

            console.log('Browser đã được khởi tạo thành công');

        } catch (error) {
            console.error('Lỗi khởi tạo browser:', error.message);

            // Thử lại với headless mode
            console.log('Thử lại với chế độ headless...');
            try {
                this.browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                });

                this.page = await this.browser.newPage();
                await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

                console.log('Browser đã được khởi tạo (headless mode)');

            } catch (retryError) {
                console.error('Không thể khởi tạo browser:', retryError.message);
                throw retryError;
            }
        }
    }

    async searchKeyword(keyword) {
        try {
            console.log(`Đang tìm kiếm từ khóa: "${keyword}"`);

            // Encode từ khóa để sử dụng trong URL
            const encodedKeyword = encodeURIComponent(keyword);
            const searchUrl = `https://www.google.com/search?q=${encodedKeyword}`;

            // Truy cập trực tiếp URL tìm kiếm
            await this.page.goto(searchUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Chờ kết quả tải
            await this.page.waitForSelector('#search', { timeout: 15000 });

            // Scroll xuống để tìm phần "Mọi người cũng tìm kiếm"
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });

            // Chờ một chút để nội dung tải
            await new Promise(resolve => setTimeout(resolve, 3000));

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
            console.log('🔍 Đang tìm phần "Mọi người cũng tìm kiếm"...');

            let keywords = [];

            // Phương pháp 1: Tìm tất cả text trong các div có chứa từ khóa
            console.log('📋 Phương pháp 1: Tìm text trực tiếp...');
            try {
                const allDivs = await this.page.$$('div');
                console.log(`Tìm thấy ${allDivs.length} div elements`);

                for (const div of allDivs) {
                    const text = await this.page.evaluate(el => {
                        const textContent = el.textContent?.trim() || '';
                        // Chỉ lấy text từ các div có độ dài hợp lý và không chứa quá nhiều text
                        if (textContent.length > 5 && textContent.length < 100) {
                            // Kiểm tra xem có phải là từ khóa tìm kiếm không
                            const keywords = ['mua', 'code', 'đồ án', 'web', 'java', 'spring', 'android', 'cntt', 'thuê', 'source'];
                            const lowerText = textContent.toLowerCase();
                            const hasKeyword = keywords.some(kw => lowerText.includes(kw));

                            if (hasKeyword && !lowerText.includes('mọi người') && !lowerText.includes('tìm kiếm')) {
                                return textContent;
                            }
                        }
                        return null;
                    }, div);

                    if (text) {
                        console.log(`✅ Tìm thấy từ khóa: "${text}"`);
                        keywords.push(text);
                    }
                }
            } catch (err) {
                console.log('❌ Lỗi phương pháp 1:', err.message);
            }

            // Phương pháp 2: Tìm từ URL của các links
            if (keywords.length === 0) {
                console.log('📋 Phương pháp 2: Tìm từ URL links...');
                try {
                    const allLinks = await this.page.$$('a[href*="/search?"]');
                    console.log(`Tìm thấy ${allLinks.length} search links`);

                    for (const link of allLinks) {
                        const href = await this.page.evaluate(el => el.href, link);
                        if (href && href.includes('q=')) {
                            try {
                                const url = new URL(href);
                                const keyword = url.searchParams.get('q');
                                if (keyword && keyword.length > 2 && keyword.length < 100) {
                                    const decodedKeyword = decodeURIComponent(keyword);
                                    console.log(`✅ Tìm thấy từ URL: "${decodedKeyword}"`);
                                    keywords.push(decodedKeyword);
                                }
                            } catch (urlErr) {
                                // Skip invalid URLs
                            }
                        }
                    }
                } catch (err) {
                    console.log('❌ Lỗi phương pháp 2:', err.message);
                }
            }

            // Phương pháp 3: Tìm bằng cách scroll và chờ
            if (keywords.length === 0) {
                console.log('📋 Phương pháp 3: Scroll và tìm lại...');
                try {
                    // Scroll xuống nhiều hơn
                    await this.page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight * 0.7);
                    });

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Tìm lại với các selector khác
                    const moreSelectors = [
                        'span:contains("mua")',
                        'span:contains("code")',
                        'span:contains("đồ án")',
                        'div[role="listitem"]',
                        '[data-ved] span'
                    ];

                    for (const selector of moreSelectors) {
                        const elements = await this.page.$$(selector);
                        for (const el of elements) {
                            const text = await this.page.evaluate(element => element.textContent?.trim(), el);
                            if (text && text.length > 5 && text.length < 100) {
                                const lowerText = text.toLowerCase();
                                if ((lowerText.includes('mua') || lowerText.includes('code') || lowerText.includes('đồ án'))
                                    && !lowerText.includes('mọi người')) {
                                    console.log(`✅ Tìm thấy (scroll): "${text}"`);
                                    keywords.push(text);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.log('❌ Lỗi phương pháp 3:', err.message);
                }
            }

            // Làm sạch và loại bỏ trùng lặp
            keywords = [...new Set(keywords)]
                .filter(keyword => keyword && keyword.length > 3 && keyword.length < 100)
                .map(keyword => keyword.replace(/[""]/g, '').trim())
                .filter(keyword => keyword.length > 0)
                .filter(keyword => !keyword.toLowerCase().includes('mọi người'))
                .filter(keyword => !keyword.toLowerCase().includes('tìm kiếm'))
                .slice(0, 10); // Giới hạn 10 từ khóa

            console.log(`🎯 Kết quả cuối cùng: ${keywords.length} từ khóa`);
            keywords.forEach((kw, index) => {
                console.log(`  ${index + 1}. "${kw}"`);
            });

            return keywords;

        } catch (error) {
            console.error('❌ Lỗi khi trích xuất từ khóa liên quan:', error.message);
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
