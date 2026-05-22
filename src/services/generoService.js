const prisma = require ('../config/prisma');
const rabbitmq = require('../config/rabbitmq');

async function listarGeneros(filtros = {}) {
    const where = {};

    if (filtros.status !== undefined){
        where.status = Number(filtros.status);
    }

    return await prisma.genero.findMany({ where });
}

async function buscarGeneroPorId(id) {
    return await prisma.genero.findUnique({
        where: { id: Number(id) }
    });
}

async function cadastrarGenero(dados) {
    const novoGenero = await prisma.genero.create({
        data: {
            nome: dados.nome,
            descricao: dados.descricao,
            status: 1
        }
    });

    await rabbitmq.publish(rabbitmq.EVENTS.GENERO_CRIADO, {
        generoId: novoGenero.id,
        nome: novoGenero.nome
    });

    return novoGenero;
}

async function alterarStatusGenero(id, status) {
    const generoAtualizado = await prisma.genero.update({
        where: { id: Number(id) },
        data: { status: Number(status) }
    });

    await rabbitmq.publish(rabbitmq.EVENTS.GENERO_ALTERADO, {
        generoId: generoAtualizado.id,
        status: generoAtualizado.status
    });

    return generoAtualizado;
}

module.exports = { listarGeneros, buscarGeneroPorId, cadastrarGenero, alterarStatusGenero };