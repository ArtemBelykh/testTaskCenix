const puppeteer = require('puppeteer');
const fs = require('fs');

// Функция для создания скриншота и сохранения его на диск
async function takeScreenshot(page, filePath) {
    await page.screenshot({ path: filePath, fullPage: true });
}

// Функция для получения цены, рейтинга и количества отзывов
async function getProductDetails(page) {
    const price = await page.evaluate(() => {
        // Попробуйте получить зачеркнутую цену, если такая есть
        const oldPriceElement = document.querySelector('.PriceInfo_oldPrice__IW3mC');
        const oldPrice = oldPriceElement ? oldPriceElement.textContent.trim() : "No old price";
        // Получаем текущую цену
        const currentPriceElement = document.querySelector('.Price_price__QzA8L');
        const currentPrice = currentPriceElement ? currentPriceElement.textContent.trim() : "No Price";
        return { oldPrice, currentPrice };
    });

    const rating = await page.evaluate(() => {
        // Получаем рейтинг товара
        const ratingElement = document.querySelector('.Rating_root__sjjtR');
        return ratingElement ? ratingElement.textContent.trim() : null;
    });

    const reviewCount = await page.evaluate(() => {
        // Получаем количество отзывов на товар
        const reviewCountElement = document.querySelector('.ActionsRow_reviews__AfSj_');
        return reviewCountElement ? reviewCountElement.textContent.trim() : null;
    });

    return { price, rating, reviewCount };
}

(async () => {
    try {
        // Получаем аргументы командной строки
        const [url, region] = process.argv.slice(2);

        // Запускаем браузер
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Устанавливаем пользовательский агент
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36');

        // Открываем страницу товара
        await page.goto(url);


        // Ждем, пока не будет доступен определенный элемент, который говорит о том, что страница полностью загружена
        await page.waitForSelector('.FeatureAppLayoutBase_main__sV1z_', { timeout: 10000 }); // Замените 'your-selector' на ваш реальный селектор

        // Создаем скриншот и сохраняем на диск
        await takeScreenshot(page, 'screenshot.jpg');

        // Получаем детали продукта
        const productDetails = await getProductDetails(page);

        // Сохраняем цены, рейтинг и количество отзывов в файл
        const dataToWrite = `Region: ${region}\nPrice: ${productDetails.price.currentPrice}\nOld Price: ${productDetails.price.oldPrice}\nRating: ${productDetails.rating}\nReview Count: ${productDetails.reviewCount}`;
        fs.writeFileSync('product.txt', dataToWrite);

        // Закрываем браузер
        await browser.close();
    } catch (error) {
        console.error('Не удалось найти элемент на странице. Возможно, произошла ошибка или страница не загрузилась полностью.');
        await browser.close();
        return;
    }
})();
