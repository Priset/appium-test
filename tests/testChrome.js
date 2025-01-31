const wdio = require("webdriverio");
const { exec, spawn } = require("child_process");
const fs = require("fs");

const opts = {
    path: "/",
    port: 4723,
    capabilities: {
        platformName: "Android",
        "appium:automationName": "uiautomator2",
        "appium:deviceName": "ACSPUT1A29017811",
        "appium:platformVersion": "13",
        "browserName": "Chrome",
        "appium:chromedriverExecutable": "C:\\Users\\emanu\\Downloads\\chromedriver-win64\\chromedriver.exe",
        "appium:noReset": true,
        "appium:fullReset": false
    },
};

async function main() {
    const driver = await wdio.remote(opts);

    console.log("Inserando URL de  Noticiero....");

    const searchUrl = await driver.$('//android.widget.EditText[@resource-id="com.android.chrome:id/url_bar"]');
    await searchUrl.waitForDisplayed({ timeout: 5000 });
    await searchUrl.click();
    console.log("Busqueda presionada.");

    await driver.pause(5000);

    const textUrl = await driver.$('//android.widget.EditText[@resource-id="com.android.chrome:id/url_bar"]');
    await textUrl.waitForDisplayed({ timeout: 5000 });
    await textUrl.sendKeys("https://www.la-razon.com");
    console.log("URL insertada.");

    const searchButton = await driver.$('//androidx.recyclerview.widget.RecyclerView[@resource-id="com.android.chrome:id/omnibox_suggestions_dropdown"]/android.view.ViewGroup[2]/android.widget.ImageView"]');
    await searchButton.waitForDisplayed({ timeout: 5000 });
    await searchButton.click();
    console.log("Busqueda presionada.");

    await driver.deleteSession();
}

// Ejecutar el script principal
main().catch((err) => {
    console.error("Error durante la ejecución principal:", err);
});
