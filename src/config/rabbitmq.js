/**
 * src/config/rabbitmq.js
 */
const amqplib = require('amqplib');

const RECONNECT_DELAY_MS = Number(process.env.RABBITMQ_RECONNECT_DELAY) || 5000;
const EXCHANGE = 'biblioteca';
const EXCHANGE_TYPE = 'topic';

let connection = null;
let channel = null;
let connecting = false;

async function connect() {
    if (connecting) return;
    connecting = true;

    const RABBITMQ_URL = process.env.RABBITMQ_URL;

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


async function iniciarConsumidores() {
    const prisma = require('./prisma'); // singleton — nunca new PrismaClient()

    // ── Fila 1: empréstimo criado → marcar exemplar como Emprestado ────────
    const qEmprestimo = 'catalogo.fila.emprestimo.criado';
    await channel.assertQueue(qEmprestimo, { durable: true });
    await channel.bindQueue(qEmprestimo, EXCHANGE, 'biblioteca.emprestimo.criado');

    channel.consume(qEmprestimo, async (msg) => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString());
            const { exemplarId } = payload;

            if (exemplarId) {
                await prisma.exemplar.update({
                    where: { id: Number(exemplarId) },
                    data: { disponibilidade: 'Emprestado' } // campo correto do schema
                });
                console.log(`[RabbitMQ Consumer] Exemplar ${exemplarId} marcado como Emprestado via evento.`);
            }

            channel.ack(msg);
        } catch (err) {
            console.error('[RabbitMQ Consumer] Erro ao processar biblioteca.emprestimo.criado:', err.message);
            channel.nack(msg, false, false); // descarta sem requeue para evitar loop
        }
    });

    // ── Fila 2: devolução registrada → marcar exemplar como Disponivel ─────
    const qDevolucao = 'catalogo.fila.devolucao.registrada';
    await channel.assertQueue(qDevolucao, { durable: true });
    await channel.bindQueue(qDevolucao, EXCHANGE, 'biblioteca.devolucao.registrada');

    channel.consume(qDevolucao, async (msg) => {
        if (!msg) return;
        try {
            const payload = JSON.parse(msg.content.toString());
            const { exemplarId } = payload;

            if (exemplarId) {
                await prisma.exemplar.update({
                    where: { id: Number(exemplarId) },
                    data: { disponibilidade: 'Disponivel' } // campo correto do schema
                });
                console.log(`[RabbitMQ Consumer] Exemplar ${exemplarId} marcado como Disponivel via evento.`);
            }

            channel.ack(msg);
        } catch (err) {
            console.error('[RabbitMQ Consumer] Erro ao processar biblioteca.devolucao.registrada:', err.message);
            channel.nack(msg, false, false);
        }
    });

    console.log('[RabbitMQ] Consumidores do Catálogo iniciados com sucesso.');
}

module.exports = { connect, publish, EVENTS, iniciarConsumidores };