const livroController = require('../controllers/livroController');

module.exports = async function (fastify, opts) {
    fastify.get('/', livroController.listarLivros);
    fastify.get('/:id', livroController.buscarLivro);
    fastify.post('/', livroController.cadastrarLivro);
    fastify.patch('/:id/status', livroController.alterarStatus);
};