const livroService = require('../services/livroService');

async function listarLivros(request, reply) {
    try {
        const livros = await livroService.listarLivros(request.query);
        return reply.status(200).send(livros);
    } catch (error) {
        return reply.status(500).send({ erro: 'Erro ao listar livros.' });
    }
}

async function buscarLivro(request, reply) {
    try {
        const livro = await livroService.buscarLivroPorId(request.params.id);
        if (!livro) {
            return reply.status(404).send({ erro: 'Livro não encontrado.' });
        }
        return reply.status(200).send(livro);
    } catch (error) {
        return reply.status(500).send({ erro: 'Erro ao buscar o livro.' });
    }
}

async function cadastrarLivro(request, reply) {
    try {
        const novoLivro = await livroService.cadastrarLivro(request.body);
        return reply.status(201).send(novoLivro);
    } catch (error) {
        // Tratar o erro de ISBN duplicado devolvido pelo Prisma
        if (error.code === 'P2002') {
            return reply.status(409).send({ erro: 'O ISBN informado já se encontra registado.' });
        }
        return reply.status(500).send({ erro: 'Erro interno ao cadastrar o livro.' });
    }
}

async function alterarStatus(request, reply) {
    try {
        const { id } = request.params;
        const { status } = request.body;

        const livroAtualizado = await livroService.alterarStatusLivro(id, status);
        return reply.status(200).send(livroAtualizado);
    } catch (error) {
        return reply.status(500).send({ erro: 'Erro ao alterar o estado do livro.' });
    }
}

async function editarLivro(request, reply) {
    try {
        const { id } = request.params;
        const livroAtualizado = await livroService.editarLivro(id, request.body);
        if (!livroAtualizado) {
            return reply.status(404).send({ erro: 'Livro não encontrado.' });
        }
        return reply.status(200).send(livroAtualizado);
    } catch (error) {
        if (error.code === 'P2002') {
            return reply.status(409).send({ erro: 'O ISBN informado já se encontra registado.' });
        }
        if (error.code === 'P2025') {
            return reply.status(404).send({ erro: 'Livro não encontrado.' });
        }
        return reply.status(500).send({ erro: 'Erro interno ao editar o livro.' });
    }
}

module.exports = { listarLivros, buscarLivro, cadastrarLivro, alterarStatus, editarLivro };