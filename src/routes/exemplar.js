const exemplarController = require('../controllers/exemplarController');

module.exports = async function (fastify, opts) {
    fastify.get('/', exemplarController.listarExemplares);
    fastify.get('/:id', exemplarController.buscarExemplar);
    fastify.post('/livro/:livroId', exemplarController.adicionarExemplar); // Atenção aqui na URL!
    fastify.patch('/:id/status', exemplarController.alterarExemplar);

    // Rotas protegidas — exigem token JWT do microsserviço de Usuário
    // fastify.post('/livro/:livroId', { preHandler: verificarToken }, exemplarController.adicionarExemplar);
    // fastify.patch('/:id/status', { preHandler: verificarToken }, exemplarController.alterarExemplar);
};