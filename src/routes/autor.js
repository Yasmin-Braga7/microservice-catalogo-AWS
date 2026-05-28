const autorController = require('../controllers/autorController');

module.exports = async function (fastify, opts) {
    fastify.get('/', autorController.listarAutores);
    fastify.get('/:id', autorController.buscarAutor);
    fastify.post('/', autorController.cadastrarAutor);
    fastify.patch('/:id/status', autorController.alterarStatus);

    // Rotas protegidas — exigem token JWT do microsserviço de Usuário
    // fastify.post('/', { preHandler: verificarToken }, autorController.cadastrarAutor);
    // fastify.patch('/:id/status', { preHandler: verificarToken }, autorController.alterarStatus);
};