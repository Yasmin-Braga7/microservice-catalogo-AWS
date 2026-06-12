const uploadController = require('../controllers/uploadController');

module.exports = async function (fastify, opts) {
    // POST /livros/:id/capa  — envia ou substitui a capa (multipart/form-data, campo "file")
    fastify.post('/:id/capa', uploadController.uploadCapa);

    // GET  /livros/:id/capa  — retorna a imagem pura (bytes) para exibição no navegador/app
    fastify.get('/:id/capa', uploadController.exibirCapa);

    // DELETE /livros/:id/capa — remove a capa do livro
    fastify.delete('/:id/capa', uploadController.deletarCapa);
};
