/**
 * src/config/rabbitmq.js
 */
const amqplib = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RECONNECT_DELAY_MS = Number(process.env.RABBITMQ_RECONNECT_DELAY) || 5000;
const EXCHANGE = 'biblioteca';
const EXCHANGE_TYPE = 'topic';

let connection = null;
let channel = null;
let connecting = false;

async function connect() {
    if (connecting) return;
    connecting = true;

    try {
        console.log('[RabbitMQ] Conectando em', RABBITMQ_URL.replace(/:\/\/.*@/, '://***@'));
        connection = await amqplib.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });

        console.log('[RabbitMQ] Conectado. Exchange:', EXCHANGE);
        connecting = false;

        connection.on('close', () => {
            console.warn('[RabbitMQ] Conexão encerrada. Reconectando...');
            connection = null;
            channel = null;
            connecting = false;
            setTimeout(connect, RECONNECT_DELAY_MS);
        });

        connection.on('error', (err) => console.error('[RabbitMQ] Erro:', err.message));
    } catch (err) {
        connecting = false;
        console.error('[RabbitMQ] Falha ao conectar:', err.message);
        setTimeout(connect, RECONNECT_DELAY_MS);
    }
}

async function publish(routingKey, payload) {
    if (!channel) return false;
    try {
        const buffer = Buffer.from(JSON.stringify(payload));
        channel.publish(EXCHANGE, routingKey, buffer, {
            persistent: true,
            contentType: 'application/json',
            timestamp: Math.floor(Date.now() / 1000),
            appId: 'biblioteca-catalogo', // ID do seu serviço
        });
        console.log('[RabbitMQ] Publicado:', routingKey, payload);
        return true;
    } catch (err) {
        return false;
    }
}

// Eventos que o Catálogo pode emitir
const EVENTS = {
    LIVRO_CRIADO: 'biblioteca.catalogo.livro_criado',
    LIVRO_ALTERADO: 'biblioteca.catalogo.livro_alterado',
    EXEMPLAR_ADICIONADO: 'biblioteca.catalogo.exemplar_adicionado',
    EXEMPLAR_ALTERADO: 'biblioteca.catalogo.exemplar_alterado',
    GENERO_CRIADO: 'biblioteca.catalogo.genero_criado',
    GENERO_ALTERADO: 'biblioteca.catalogo.genero_alterado',
    AUTOR_CRIADO: 'biblioteca.catalogo.autor_criado',
    AUTOR_ALTERADO: 'biblioteca.catalogo.autor_alterado'
};

module.exports = { connect, publish, EVENTS };