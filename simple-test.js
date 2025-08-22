const puppeteer = require('puppeteer');

async function simpleTest() {
    console.log('🧪 Test đơn giản...');
    
    let browser = null;
    
    try {
        // Khởi tạo browser với cấu hình tối thiểu
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox']
        });
        
        console.log('✅ Browser đã khởi tạo');
        
        const page = await browser.newPage();
        console.log('✅ Page đã tạo');
        
        // Test 1: Truy cập trang đơn giản
        console.log('🌐 Test 1: Truy cập example.com...');
        await page.goto('https://example.com', { timeout: 10000 });
        
        let url = page.url();
        let title = await page.title();
        console.log(`📍 URL: ${url}`);
        console.log(`📄 Title: ${title}`);
        
        if (url.includes('about:blank')) {
            console.log('❌ Vẫn bị about:blank - có vấn đề với network');
            return;
        }
        
        console.log('✅ Test 1 thành công!');
        
        // Test 2: Truy cập Google
        console.log('🌐 Test 2: Truy cập Google...');
        await page.goto('https://www.google.com', { timeout: 10000 });
        
        url = page.url();
        title = await page.title();
        console.log(`📍 URL: ${url}`);
        console.log(`📄 Title: ${title}`);
        
        if (url.includes('about:blank')) {
            console.log('❌ Google bị chặn - thử DuckDuckGo');
            
            // Test 3: DuckDuckGo
            console.log('🌐 Test 3: Truy cập DuckDuckGo...');
            await page.goto('https://duckduckgo.com', { timeout: 10000 });
            
            url = page.url();
            title = await page.title();
            console.log(`📍 URL: ${url}`);
            console.log(`📄 Title: ${title}`);
        }
        
        console.log('✅ Test hoàn thành!');
        console.log('🔍 Kiểm tra browser window để xem trang có load không');
        console.log('⏳ Browser sẽ mở 10 giây để bạn xem...');
        
        // Giữ browser mở 10 giây
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        
        // Kiểm tra network
        console.log('\n🔧 Kiểm tra network:');
        console.log('1. Bạn có đang dùng VPN/Proxy không?');
        console.log('2. Firewall có chặn Chrome không?');
        console.log('3. Thử tắt antivirus tạm thời');
        console.log('4. Kiểm tra DNS: nslookup google.com');
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

simpleTest();
