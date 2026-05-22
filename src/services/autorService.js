const prisma = require('../config/prisma');
const rabbitmq = require('../config/rabbitmq');

async function listarAutores(filtros = {}) {
    const where = {};

    if (filtros.status !== undefined) {
        where.status = Number(filtros.status);
    }

    return await prisma.autor.findMany({ where });
}

async function buscarAutorPorId(id) {
    return await prisma.autor.findUnique({
        where: { id: Number(id) }
    });
}

async function cadastrarAutor(dados) {
    const novoAutor = await prisma.autor.create({
        data: {
            nome: dados.nome,
            dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
            nacionalidade: dados.nacionalidade,
            biografia: dados.biografia,
            status: 1
        }
    });

    await rabbitmq.publish(rabbitmq.EVENTS.AUTOR_CRIADO, {
        autorId: novoAutor.id,
        nome: novoAutor.nome
    });

    return novoAutor;
}

async function alterarStatusAutor(id, status) {
    const autorAtualizado = await prisma.autor.update({
        where: { id: Number(id) },
        data: { status: Number(status) }
    });

    await rabbitmq.publish(rabbitmq.EVENTS.AUTOR_ALTERADO, {
        autorId: autorAtualizado.id,
        status: autorAtualizado.status
    });

    return autorAtualizado;
}

module.exports = { listarAutores, buscarAutorPorId, cadastrarAutor, alterarStatusAutor };