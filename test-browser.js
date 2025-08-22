const puppeteer = require('puppeteer');

async function testBrowser() {
    console.log('🧪 Test khởi tạo browser...');
    let browser = null;

    try {
        console.log('📋 Kiểm tra Puppeteer...');
        console.log('Puppeteer path:', require.resolve('puppeteer'));

        // Test 1: Headless mode
        console.log('📋 Test 1: Thử khởi tạo browser headless...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions'
            ]
        });

        console.log('✅ Browser headless khởi tạo thành công');

        const page = await browser.newPage();
        console.log('✅ Tạo page thành công');

        // Set timeout ngắn hơn
        page.setDefaultNavigationTimeout(10000);
        page.setDefaultTimeout(5000);

        await page.goto('https://www.google.com', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });
        console.log('✅ Truy cập Google thành công');

        const title = await page.title();
        console.log('✅ Lấy title thành công:', title);

        await browser.close();
        browser = null;
        console.log('✅ Đóng browser thành công');

        // Test 2: Non-headless mode
        console.log('\n📋 Test 2: Thử khởi tạo browser có giao diện...');
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        console.log('✅ Browser có giao diện khởi tạo thành công');

        const page2 = await browser.newPage();
        await page2.goto('https://www.google.com', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });
        console.log('✅ Truy cập Google với giao diện thành công');

        // Giữ browser mở 3 giây để xem
        console.log('⏳ Giữ browser mở 3 giây để xem...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        await browser.close();
        browser = null;

        console.log('🎉 Test hoàn thành - Puppeteer hoạt động bình thường');

    } catch (error) {
        console.error('❌ Test thất bại:', error.message);

        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Lỗi đóng browser:', closeError.message);
            }
        }

        console.log('\n🔧 Hướng dẫn khắc phục:');
        console.log('1. Cài đặt lại Puppeteer:');
        console.log('   npm uninstall puppeteer puppeteer-core');
        console.log('   npm install puppeteer');
        console.log('2. Hoặc cài Chrome:');
        console.log('   brew install --cask google-chrome');
        console.log('3. Kiểm tra Chrome đã cài chưa:');
        console.log('   ls "/Applications/Google Chrome.app"');
    }
}

testBrowser();
