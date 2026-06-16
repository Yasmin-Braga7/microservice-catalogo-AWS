const livroController = require('../controllers/livroController');

module.exports = async function (fastify, opts) {
    fastify.get('/', livroController.listarLivros);
    fastify.get('/:id', livroController.buscarLivro);
    fastify.post('/', livroController.cadastrarLivro);
    fastify.put('/:id', livroController.editarLivro);
    fastify.patch('/:id/status', livroController.alterarStatus);

    // Rotas protegidas — exigem token JWT do microsserviço de Usuário
    // fastify.post('/', { preHandler: verificarToken }, livroController.cadastrarLivro);
    // fastify.patch('/:id/status', { preHandler: verificarToken }, livroController.alterarStatus);
};