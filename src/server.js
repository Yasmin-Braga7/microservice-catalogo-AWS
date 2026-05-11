const fastify = require('fastify')({ logger: true });
const rabbitmq = require('./config/rabbitmq');
fastify.register(require('./plugins/prisma'));


fastify.register(require('./routes/livro'), { prefix: '/biblioteca/catalogo/livros' });
fastify.register(require('./routes/exemplar'), { prefix: '/biblioteca/catalogo/exemplares' });
fastify.register(require('./routes/autor'), { prefix: '/biblioteca/catalogo/autores' });
fastify.register(require('./routes/genero'), { prefix: '/biblioteca/catalogo/generos' });

const start = async () => {
    try {
        await rabbitmq.connect();

        await fastify.listen({ port: 9502, host: '0.0.0.0' });

        console.log('Servidor de Catálogo rodando na porta 9502');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();