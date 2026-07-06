const { InfisicalSDK } = require("@infisical/sdk");

async function carregarSenhasSeguras() {
    if (!process.env.INFISICAL_CLIENT_ID) {
        console.warn("[BabyShark] Chaves do Infisical ausentes. Usando variáveis locais.");
        return;
    }

    // 1. Na nova versão, usamos InfisicalSDK em vez de InfisicalClient
    const client = new InfisicalSDK({
        siteUrl: "https://app.infisical.com"
    });

    try {
        // 2. Precisamos fazer o "login" do robô antes de pegar as senhas
        await client.auth().universalAuth.login({
            clientId: process.env.INFISICAL_CLIENT_ID,
            clientSecret: process.env.INFISICAL_CLIENT_SECRET
        });

        // 3. A forma de buscar os secrets também mudou um pouquinho
        const dbSecret = await client.secrets().getSecret({
            environment: "dev",
            projectId: process.env.INFISICAL_PROJECT_ID,
            secretPath: "/AWS",
            secretName: "DATABASE_URL"
        });

        const rabbitSecret = await client.secrets().getSecret({
            environment: "dev",
            projectId: process.env.INFISICAL_PROJECT_ID,
            secretPath: "/AWS",
            secretName: "RABBITMQ_URL"
        });

        // 4. Injetamos os valores reais no ambiente
        process.env.DATABASE_URL = dbSecret.secretValue;
        process.env.RABBITMQ_URL = rabbitSecret.secretValue;
        
        console.log("[BabyShark] Senhas carregadas do Infisical com sucesso!");
    } catch (erro) {
        console.error("Fio terra! Erro crítico ao buscar as senhas no Infisical:", erro.message);
        process.exit(1); 
    }
}

module.exports = { carregarSenhasSeguras };