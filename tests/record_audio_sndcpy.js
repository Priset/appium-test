const wdio = require("webdriverio");
const { exec } = require("child_process");

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
 * Inicia sndcpy para redirigir el audio del dispositivo
 * @param {string} outputFile - Ruta donde se guardará el archivo de audio
 * @param {number} duration - Duración en segundos de la grabación
 * @returns {object} Proceso de sndcpy en ejecución
 */
function startSndcpyRecording(outputFile, duration) {
    const sndcpyCommand = `cmd /c start /wait sndcpy --output ${outputFile} --time ${duration}`;
    console.log(`Iniciando grabación con sndcpy: ${sndcpyCommand}`);

    const process = exec(sndcpyCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando sndcpy: ${error.message}`);
        }
        if (stderr) {
            console.error(`Salida de error de sndcpy: ${stderr}`);
        }
    });

    return process;
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
    const audioFileName = `tiktok_audio_${Date.now()}.wav`;
    const recordingDuration = 10; // Duración en segundos

    // Iniciar grabación de audio con sndcpy
    console.log("Iniciando grabación de audio con sndcpy...");
    const sndcpyProcess = startSndcpyRecording(audioFileName, recordingDuration);

    // Esperar a que el primer video cargue
    console.log("Esperando que el primer video cargue...");
    await driver.pause(recordingDuration * 1000); // Tiempo suficiente para grabar el audio

    console.log("Grabación finalizada.");

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

    // Esperar la finalización de sndcpy
    console.log("Esperando que sndcpy finalice...");
    sndcpyProcess.on("close", (code) => {
        if (code === 0) {
            console.log(`Grabación de audio guardada en: ${audioFileName}`);
        } else {
            console.error("Hubo un problema al grabar el audio con sndcpy.");
        }
    });

    // Finalizar sesión
    await driver.deleteSession();
    console.log("Sesión finalizada y aplicación cerrada.");
}

// Ejecutar el script principal
main().catch((err) => {
    console.error("Error durante la ejecución principal:", err);
});
