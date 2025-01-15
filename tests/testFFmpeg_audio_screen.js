const { exec, spawn } = require("child_process");

const wdio = require("webdriverio");

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
 * Inicia scrcpy para capturar el video de la pantalla del dispositivo
 * @param {string} videoOutputFile - Ruta para guardar el archivo de video
 * @returns {object} Proceso de scrcpy en ejecución
 */
function startScrcpyRecording(videoOutputFile) {
    const scrcpyCommand = `scrcpy --no-playback --record ${videoOutputFile}`;
    console.log(`Iniciando grabación con scrcpy: ${scrcpyCommand}`);

    const process = exec(scrcpyCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando scrcpy: ${error.message}`);
        }
        if (stderr) {
            console.error(`Salida de error de scrcpy: ${stderr}`);
        }
    });

    return process;
}

/**
 * Inicia sndcpy para redirigir el audio desde el dispositivo
 * @param {string} audioOutputFile - Ruta para guardar el archivo de audio
 * @returns {object} Proceso de sndcpy en ejecución
 */
function startSndcpyRecording(audioOutputFile) {
    const sndcpyCommand = `cmd /c start /wait sndcpy --output ${audioOutputFile}`;
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
 * Combina el video y audio en un archivo MP4 usando FFmpeg
 * @param {string} videoFile - Archivo de video generado por scrcpy
 * @param {string} audioFile - Archivo de audio generado por sndcpy
 * @param {string} outputFile - Archivo combinado de salida
 */
function mergeAudioVideo(videoFile, audioFile, outputFile) {
    const ffmpegCommand = `ffmpeg -y -i ${videoFile} -i ${audioFile} -c:v copy -c:a aac -strict experimental ${outputFile}`;
    console.log(`Iniciando combinación con FFmpeg: ${ffmpegCommand}`);

    exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando FFmpeg: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Salida de error de FFmpeg: ${stderr}`);
        }
        console.log(`Combinación completada. Archivo final: ${outputFile}`);
    });
}

/**
 * Desliza la pantalla en la aplicación de TikTok
 * @param {object} driver - Instancia de WebDriver
 * @param {number} startX - Coordenada inicial X
 * @param {number} startY - Coordenada inicial Y
 * @param {number} endX - Coordenada final X
 * @param {number} endY - Coordenada final Y
 * @param {number} duration - Tiempo de duración del deslizamiento (ms)
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

/**
 * Lógica principal del script
 */
async function main() {
    const driver = await wdio.remote(opts);
    console.log("¡TikTok iniciado exitosamente!");

    // Archivos temporales y configuración
    const videoFileName = `tiktok_video_${Date.now()}.mp4`;
    const audioFileName = `tiktok_audio_${Date.now()}.wav`;
    const outputFileName = `tiktok_combined_${Date.now()}.mp4`;
    const recordingDuration = 10; // Duración en segundos

    // Iniciar grabación de video y audio
    console.log("Iniciando grabación de video y audio...");
    const scrcpyProcess = startScrcpyRecording(videoFileName);
    const sndcpyProcess = startSndcpyRecording(audioFileName);

    // Esperar mientras se graba
    console.log("Esperando la duración de la grabación...");
    await driver.pause(recordingDuration * 1000); // Grabar durante el tiempo configurado

    // Finalizar procesos
    scrcpyProcess.kill("SIGINT");
    console.log("Grabación de video finalizada.");
    sndcpyProcess.on("close", () => {
        console.log("Grabación de audio finalizada.");
        // Combinación de video y audio
        mergeAudioVideo(videoFileName, audioFileName, outputFileName);
    });

    // Deslizar al siguiente video
    console.log("Deslizando hacia arriba para el siguiente video...");
    const windowSize = await driver.getWindowSize();
    const width = windowSize.width;
    const height = windowSize.height;

    const startX = width * 0.3; // 30% del ancho
    const startY = height * 0.8; // 80% de la altura
    const endX = width * 0.3; // 30% del ancho
    const endY = height * 0.2; // 20% de la altura

    await swipe(driver, startX, startY, endX, endY);
    console.log("¡Siguiente video!");

    // Finalizar sesión de Appium
    await driver.deleteSession();
    console.log("Sesión finalizada y aplicación cerrada.");
}

// Ejecutar el script
main().catch((err) => {
    console.error("Error durante la ejecución principal:", err);
});
