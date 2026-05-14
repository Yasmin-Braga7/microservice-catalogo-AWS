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

        stage('Fazer Deploy com Compose') {
            steps {
                // Injeta os caminhos mais comuns do Docker no Windows e roda o compose
                bat '''
                set PATH=C:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\Program Files\\Docker\\Docker\\client;%PATH%
                docker compose up -d --build
                '''
            }
        }
    }

    post {
        success {
            echo 'Deploy do Catálogo realizado com sucesso no Yacht (Ambiente Windows)!'
        }
        failure {
            echo 'Houve um erro durante o deploy do Catálogo no Windows.'
        }
    }
}