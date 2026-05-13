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
                // Instala pacotes do Node e gera o cliente do banco de dados
                sh 'npm install'
                sh 'npx prisma generate'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                script {
                    // Garante que o Jenkins ache o Docker no Windows
                    env.PATH = "C:\\Program Files\\Docker\\Docker\\resources\\bin;${env.PATH}"

                    // Nome da sua imagem
                    def appName = 'microservice-catalogo'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    sh "docker build -t ${imageTag} ."
                }
            }
        }

        stage('Fazer Deploy') {
            steps {
                script {
                    def appName = 'microservice-catalogo'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    // Para e remove o container antigo (se existir) para não dar conflito
                    sh "docker stop ${appName} || echo 0"
                    sh "docker rm -v ${appName} || echo 0"
                
                    // Sobe o seu container mapeando a porta 9502 (Sua porta do Catálogo!)
                    // Nota: Se precisar das variáveis de ambiente, adicione --env-file .env antes do -p
                    sh "docker run -d --name ${appName} -p 9502:9502 ${imageTag}"
                }
            }
        }
    }

    post {
        success {
            echo 'Deploy do microservice-catalogo realizado com sucesso!'
        }
        failure {
            echo 'Houve um erro durante o deploy do microservice-catalogo.'
        }
    }
}