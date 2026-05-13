pipeline {
    agent any

    stages {
        stage('Verificar Repositório') {
            steps {
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/main']], 
                    doGenerateSubmoduleConfigurations: false, 
                    extensions: [], 
                    submoduleCfg: [], 
                    userRemoteConfigs: [[url: 'https://github.com/Yasmin-Braga7/microservice-catalogo.git']]
                ])
            }
        }

        stage('Instalar Dependências') {
            steps {
                sh 'npm install'
                sh 'npx prisma generate'
            }
        }

        stage('Fazer Deploy com Compose') {
            steps {
                script {
                    // Garante que o Jenkins ache o Docker no Windows (se for o caso do servidor)
                    env.PATH = "C:\\Program Files\\Docker\\Docker\\resources\\bin;${env.PATH}"

                    // Puxa as variáveis do arquivo .env do servidor (caso exista) e sobe via compose
                    // O --build garante que ele sempre vai gerar uma imagem nova com seu código fresco
                    sh "docker compose up -d --build"
                }
            }
        }
    }

    post {
        success {
            echo 'Deploy do Catálogo realizado com sucesso no Yacht!'
        }
        failure {
            echo 'Houve um erro durante o deploy do Catálogo.'
        }
    }
}