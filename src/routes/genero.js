const generoController = require('../controllers/generoController');

module.exports = async function (fastify, opts) {
    fastify.get('/', generoController.listarGeneros);
    fastify.get('/:id', generoController.buscarGenero);
    fastify.post('/', generoController.cadastrarGenero);
    fastify.patch('/:id/status', generoController.alterarStatus);

    // Rotas protegidas — exigem token JWT do microsserviço de Usuário
    // fastify.post('/', { preHandler: verificarToken }, generoController.cadastrarGenero);
    // fastify.patch('/:id/status', { preHandler: verificarToken }, generoController.alterarStatus);
};