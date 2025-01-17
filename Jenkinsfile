pipeline {
    agent any

    environment {
        NODE_HOME = '/usr/local/bin/node' // Ruta donde está instalado Node.js
        PATH = "${NODE_HOME}:${env.PATH}" // Añadimos Node.js al PATH
    }

    stages {
        stage('Preparar Entorno') {
            steps {
                script {
                    // Verifica el sistema operativo (para Windows, usar bat en lugar de sh)
                    if (isUnix()) {
                        sh 'echo "Preparando entorno en Linux..."'
                        sh 'node -v' // Verifica la instalación de Node.js
                        sh 'npm -v' // Verifica la instalación de npm
                    } else {
                        bat 'echo Preparando entorno en Windows...'
                        bat 'node -v'
                        bat 'npm -v'
                    }
                }
            }
        }
        stage('Instalar Dependencias') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm install' // Instala las dependencias del proyecto
                    } else {
                        bat 'npm install'
                    }
                }
            }
        }
        stage('Ejecutar sndcpy') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'echo "Ejecutando sndcpy..."'
                        sh 'sndcpy &> sndcpy.log &' // Ejecuta sndcpy y guarda el log
                    } else {
                        bat 'start cmd /c sndcpy > sndcpy.log' // Ejecuta sndcpy en Windows
                    }
                }
            }
        }
        stage('Ejecutar Script Principal') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'node testTiktok.js' // Ejecuta el script principal en Linux/Mac
                    } else {
                        bat 'node testTiktok.js' // Ejecuta el script principal en Windows
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline ejecutado con éxito.'
        }
        failure {
            echo 'Hubo un error en el pipeline.'
        }
    }
}