const fastify = require('fastify')({ logger: true });
require('dotenv').config();

const { carregarSenhasSeguras } = require('./config/infisical');

const start = async () => {
    try {
        await carregarSenhasSeguras();

        const rabbitmq = require('./config/rabbitmq');
        fastify.register(require('./plugins/prisma'));

        fastify.register(require('@fastify/multipart'), {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5 MB
                files: 1,
            },
        });

        fastify.register(require('@fastify/cors'), {
            origin: '*', 
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        });

        fastify.get('/health', async (request, reply) => {
            return { status: 'ok', servico: 'catalogo' };
        });

        fastify.register(require('./routes/livro'), { prefix: '/livros' });
        fastify.register(require('./routes/exemplar'), { prefix: '/exemplares' });
        fastify.register(require('./routes/autor'), { prefix: '/autores' });
        fastify.register(require('./routes/genero'), { prefix: '/generos' });

        await rabbitmq.connect();
        await rabbitmq.iniciarConsumidores();

        await fastify.listen({ port: 9502, host: '0.0.0.0' });

        console.log('Servidor de Catálogo rodando na porta 9502');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();