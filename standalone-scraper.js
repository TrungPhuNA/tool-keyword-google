const puppeteer = require('puppeteer');

async function scrapeKeywords(keyword) {
    console.log(`🔍 Tìm kiếm từ khóa: "${keyword}"`);
    
    let browser = null;
    
    try {
        // Khởi tạo browser với anti-detection
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check',
                '--safebrowsing-disable-auto-update',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection'
            ]
        });

        console.log('✅ Browser đã khởi tạo với anti-detection');

        const page = await browser.newPage();

        // Anti-detection measures
        console.log('🛡️  Thiết lập anti-detection...');

        // 1. User Agent ngẫu nhiên
        const userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
        const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomUA);
        console.log(`🎭 User Agent: ${randomUA}`);

        // 2. Viewport ngẫu nhiên
        const viewports = [
            { width: 1366, height: 768 },
            { width: 1920, height: 1080 },
            { width: 1440, height: 900 },
            { width: 1280, height: 720 }
        ];
        const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
        await page.setViewport(randomViewport);
        console.log(`📱 Viewport: ${randomViewport.width}x${randomViewport.height}`);

        // 3. Headers giống người thật
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        });

        // 4. Override các thuộc tính bot detection
        await page.evaluateOnNewDocument(() => {
            // Override webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // Override plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Override languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['vi-VN', 'vi', 'en-US', 'en'],
            });

            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Cypress.env('NOTIFICATION_PERMISSION') || 'granted' }) :
                    originalQuery(parameters)
            );

            // Mock chrome object
            window.chrome = {
                runtime: {},
            };
        });
        console.log('✅ Page đã tạo');
        
        // Human-like behavior: Truy cập Google homepage trước
        console.log('🏠 Truy cập Google homepage trước...');
        await page.goto('https://www.google.com', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        // Random delay như người thật
        const delay1 = 2000 + Math.random() * 3000; // 2-5 giây
        console.log(`⏳ Chờ ${Math.round(delay1/1000)}s như người thật...`);
        await new Promise(resolve => setTimeout(resolve, delay1));

        // Simulate mouse movement
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200);

        // Truy cập search URL
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
        console.log(`🔍 Truy cập search: ${searchUrl}`);

        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        
        const currentUrl = page.url();
        const title = await page.title();
        
        console.log(`📍 URL: ${currentUrl}`);
        console.log(`📄 Title: ${title}`);
        
        if (currentUrl.includes('about:blank')) {
            console.log('❌ Vẫn bị about:blank');
            return [];
        }
        
        console.log('✅ Trang đã load thành công!');
        
        // Screenshot
        await page.screenshot({ path: 'standalone-search.png', fullPage: true });
        console.log('📸 Screenshot: standalone-search.png');

        // Human-like behavior: đọc trang trước khi scroll
        const delay2 = 3000 + Math.random() * 2000; // 3-5 giây
        console.log(`👀 Đọc trang ${Math.round(delay2/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay2));

        // Simulate human scrolling
        console.log('📜 Scroll từ từ như người thật...');
        await page.evaluate(() => {
            return new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if(totalHeight >= scrollHeight/2){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Random delay sau scroll
        const delay3 = 2000 + Math.random() * 2000; // 2-4 giây
        console.log(`⏳ Chờ ${Math.round(delay3/1000)}s sau scroll...`);
        await new Promise(resolve => setTimeout(resolve, delay3));
        
        // Tìm từ khóa liên quan
        console.log('🔍 Tìm từ khóa liên quan...');

        const keywords = await page.evaluate(() => {
            const results = [];

            // Tìm phần "Mọi người cũng tìm kiếm" theo cấu trúc HTML thực tế
            console.log('🔍 Tìm phần "Mọi người cũng tìm kiếm"...');

            // Tìm container chính
            const relatedContainer = document.querySelector('.y6Uyqe');
            if (!relatedContainer) {
                console.log('❌ Không tìm thấy container .y6Uyqe');
                return results;
            }

            console.log('✅ Tìm thấy container related searches');

            // Tìm tất cả các link trong phần related searches
            const relatedLinks = relatedContainer.querySelectorAll('a.ngTNl.ggLgoc');
            console.log(`📋 Tìm thấy ${relatedLinks.length} related links`);

            for (let i = 0; i < relatedLinks.length; i++) {
                const link = relatedLinks[i];

                // Tìm text trong span.dg6jd.JGD2rd
                const textSpan = link.querySelector('span.dg6jd.JGD2rd');
                if (textSpan) {
                    let text = textSpan.textContent || textSpan.innerText || '';

                    // Làm sạch text (loại bỏ các tag <b>)
                    text = text.replace(/<[^>]*>/g, '').trim();

                    if (text && text.length > 3) {
                        console.log(`${i + 1}. "${text}"`);
                        results.push(text);
                    }
                }

                // Backup: lấy từ href nếu không có text
                if (!textSpan) {
                    try {
                        const href = link.href;
                        if (href && href.includes('/search?q=')) {
                            const url = new URL(href);
                            const query = decodeURIComponent(url.searchParams.get('q') || '');

                            if (query && query.length > 3) {
                                console.log(`${i + 1}. (từ URL) "${query}"`);
                                results.push(query);
                            }
                        }
                    } catch (e) {
                        console.log(`Lỗi parse URL: ${e.message}`);
                    }
                }
            }

            console.log(`🎯 Tổng cộng tìm thấy ${results.length} từ khóa`);
            return results;
        });
        
        // Làm sạch kết quả
        const cleanKeywords = [...new Set(keywords)]
            .filter(kw => kw && kw.length > 3)
            .slice(0, 10);
        
        console.log(`🎯 Tìm thấy ${cleanKeywords.length} từ khóa:`);
        cleanKeywords.forEach((kw, index) => {
            console.log(`  ${index + 1}. "${kw}"`);
        });
        
        // Giữ browser mở 10 giây để xem
        console.log('⏳ Giữ browser mở 10 giây để xem kết quả...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        return cleanKeywords;
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        return [];
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Chạy scraper
async function main() {
    const keyword = process.argv[2] || "Code đồ án";
    console.log(`🚀 Bắt đầu scrape với từ khóa: "${keyword}"`);
    
    const results = await scrapeKeywords(keyword);
    
    if (results.length > 0) {
        console.log('\n🎉 Kết quả cuối cùng:');
        results.forEach((kw, index) => {
            console.log(`${index + 1}. ${kw}`);
        });
    } else {
        console.log('\n😞 Không tìm thấy từ khóa nào');
    }
}

main().catch(console.error);
