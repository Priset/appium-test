const wdio = require("webdriverio");
const { spawn } = require("child_process");

const opts = {
    path: "/",
    port: 4723,
    capabilities: {
        platformName: "Android",
        "appium:automationName": "uiautomator2",
        "appium:deviceName": "ACSPUT1A29017811",
        "appium:platformVersion": "13",
        "appium:appPackage": "com.zhiliaoapp.musically",
        "appium:appActivity": "com.ss.android.ugc.aweme.splash.SplashActivity",
        "appium:noReset": true,
        "appium:fullReset": false
    },
};

/**
 * Inicia la grabación de pantalla utilizando scrcpy
 * @param {string} outputFile - Ruta donde se guardará el archivo de video
 * @param {number} duration - Duración de la grabación en segundos
 * @returns {Promise} Resolución al finalizar la grabación
 */
function startScrcpyRecording(outputFile, duration) {
    return new Promise((resolve, reject) => {
        const scrcpyCommand = `scrcpy --no-playback --record ${outputFile}`;
        console.log(`Iniciando grabación con scrcpy: ${scrcpyCommand}`);

        const scrcpyProcess = spawn("cmd.exe", ["/c", scrcpyCommand], { shell: true });

        scrcpyProcess.stderr.on("data", (data) => {
            console.error(`Salida de error de scrcpy: ${data.toString()}`);
        });

        scrcpyProcess.on("close", (code) => {
            if (code === 0) {
                console.log("Grabación finalizada exitosamente.");
                resolve();
            } else {
                console.error(`scrcpy finalizó con código: ${code}`);
                reject(new Error(`scrcpy falló con código ${code}`));
            }
        });

        // Detener la grabación automáticamente después del tiempo especificado
        setTimeout(() => {
            scrcpyProcess.kill("SIGINT");
        }, duration * 1000);
    });
}

/**
 * Función para realizar un deslizamiento en la pantalla usando performActions
 * @param {object} driver - Instancia del driver de Appium
 * @param {number} startX - Coordenada inicial en X
 * @param {number} startY - Coordenada inicial en Y
 * @param {number} endX - Coordenada final en X
 * @param {number} endY - Coordenada final en Y
 * @param {number} duration - Tiempo del deslizamiento en milisegundos
 */
async function swipe(driver, startX, startY, endX, endY, duration = 300) {
    await driver.performActions([
        {
            type: "pointer",
            id: "finger1",
            parameters: { pointerType: "touch" },
            actions: [
                { type: "pointerMove", duration: 0, x: startX, y: startY },
                { type: "pointerDown", button: 0 },
                { type: "pointerMove", duration, x: endX, y: endY },
                { type: "pointerUp", button: 0 },
            ],
        },
    ]);

    await driver.releaseActions();
}

async function main() {
    const driver = await wdio.remote(opts);
    console.log("¡TikTok iniciado exitosamente!");

    // Archivo de salida para la grabación
    const videoFileName = `tiktok_recording_${Date.now()}.mp4`;

    // Iniciar grabación de pantalla con scrcpy por 15 segundos
    console.log("Iniciando grabación de pantalla...");
    const recordingDuration = 15; // Duración en segundos
    startScrcpyRecording(videoFileName, recordingDuration)
        .then(() => console.log(`Grabación guardada como: ${videoFileName}`))
        .catch((err) => console.error(`Error durante la grabación: ${err.message}`));

    // Esperar a que el primer video cargue
    console.log("Esperando que el primer video cargue...");
    await driver.pause(5000); // Ajusta según el tiempo que toma cargar el video

    // Dimensiones de la pantalla para deslizamientos
    const windowSize = await driver.getWindowSize();
    const width = windowSize.width;
    const height = windowSize.height;

    const startX = width * 0.3; // 30% del ancho (lado izquierdo)
    const startY = height * 0.8; // 80% de la altura (parte baja)
    const endX = width * 0.3; // 30% del ancho (lado izquierdo)
    const endY = height * 0.2; // 20% de la altura (parte alta)

    // Realizar un deslizamiento
    console.log("Deslizando hacia arriba para el siguiente video...");
    await swipe(driver, startX, startY, endX, endY);
    console.log("¡Siguiente video!");

    // Esperar a que termine la grabación antes de finalizar
    await driver.pause(recordingDuration * 1000);

    // Finalizar sesión
    await driver.deleteSession();
    console.log("Sesión finalizada y aplicación cerrada.");
}

// Ejecutar el script principal
main().catch((err) => {
    console.error("Error durante la ejecución principal:", err);
});
