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
        "appium:appPackage": "com.zhiliaoapp.musically",
        "appium:appActivity": "com.ss.android.ugc.aweme.splash.SplashActivity",
        "appium:noReset": true,
        "appium:fullReset": false
    },
};

/**
 * Inicia la grabación de audio utilizando FFmpeg
 * @param {string} deviceName - Nombre del dispositivo de entrada de audio
 * @param {string} outputFile - Ruta del archivo MP3 de salida
 * @param {number} duration - Duración de la grabación en segundos
 */
function startRecording(deviceName, outputFile, duration) {
    const ffmpegCommand = `ffmpeg -f dshow -i audio=\"${deviceName}\" -ac 2 -ar 44100 -t ${duration} -y \"${outputFile}\"`;
    console.log(`Iniciando grabación de audio desde: ${deviceName}...`);

    const process = spawn("cmd.exe", ["/c", ffmpegCommand], { shell: true });
    process.on("exit", (code) => {
        if (code === 0) {
            console.log(`Grabación completada. Archivo guardado en: ${outputFile}`);
        } else {
            console.error(`Error durante la grabación. Código de salida: ${code}`);
        }
    });

    return process;
}

/**
 * Descarga el video usando los botones de TikTok
 * @param {object} driver - Instancia del driver de Appium
 */
async function downloadVideo(driver) {
    console.log("Descargando video desde TikTok...");

    // Toca el botón de compartir
    const shareButton = await driver.$('//android.widget.ImageView[@resource-id="com.zhiliaoapp.musically:id/opb"]');
    await shareButton.waitForDisplayed({ timeout: 10000 });
    await shareButton.click();
    console.log("Botón de compartir presionado.");

    // Pausa para permitir que el menú de compartir cargue
    await driver.pause(5000);

    // Selecciona la opción "Guardar video"
    const saveVideoOption = await driver.$('//android.widget.Button[@content-desc="Guardar vídeo"]');
    await saveVideoOption.waitForDisplayed({ timeout: 10000 });
    await saveVideoOption.click();
    console.log("Botón de guardar video presionado.");
}

/**
 * Extrae todos los archivos MP4 de la carpeta del dispositivo Android al proyecto
 * @param {string} androidFolderPath - Ruta de la carpeta en el dispositivo Android
 * @param {string} projectFolderPath - Ruta de la carpeta destino en la computadora
 */
function extractVideos(androidFolderPath, projectFolderPath) {
    console.log("Extrayendo videos al proyecto...");

    const adbCommand = `adb pull \"${androidFolderPath}\" \"${projectFolderPath}\"`;
    exec(adbCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al extraer los videos: ${error.message}`);
            return;
        }
        console.log("Videos extraídos con éxito al proyecto:", projectFolderPath);
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

    // Configuración de grabación
    const audioDevice = "Varios micrófonos (Realtek(R) Audio)"; // Cambia al nombre de tu dispositivo
    const audioOutput = `tiktok_audio_${Date.now()}.mp3`; // Archivo de salida con nombre dinámico
    const recordingDuration = 10; // Duración de la grabación en segundos

    // Esperar a que el primer video cargue
    console.log("Esperando que el primer video cargue...");
    await driver.pause(5000); // Ajusta según el tiempo que toma cargar el video

    // Iniciar grabación de audio
    console.log("Grabando audio del primer video...");
    const recordingProcess = startRecording(audioDevice, audioOutput, recordingDuration);

    // Pausar para permitir la grabación del video
    await driver.pause(recordingDuration * 1000); // Pausa equivalente al tiempo de grabación

    // Finalizar la grabación
    console.log("Grabación finalizada.");

    // Descargar el video usando los botones de TikTok
    await downloadVideo(driver);

    // Ruta del directorio de videos en Android y destino en la computadora
    const androidFolderPath = "/storage/emulated/0/DCIM/Camera"; // Ruta de la carpeta en el dispositivo Android
    const projectFolderPath = "./tests_videos"; // Ruta en el proyecto

    // Extraer todos los videos al proyecto
    await driver.pause(5000);
    extractVideos(androidFolderPath, projectFolderPath);

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

    // Finalizar sesión
    await driver.deleteSession();
    console.log("Sesión finalizada y aplicación cerrada.");
}

// Ejecutar el script principal
main().catch((err) => {
    console.error("Error durante la ejecución principal:", err);
});
