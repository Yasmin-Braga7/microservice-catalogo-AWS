const prisma = require('../config/prisma');
const rabbitmq = require('../config/rabbitmq');

async function listarExemplares(filtros = {}) {
    const where = {};

    if (filtros.disponibilidade !== undefined) {
        where.disponibilidade = filtros.disponibilidade;
    }

    return await prisma.exemplar.findMany({
        where,
        include: { livro: true }
    });
}

async function buscarExemplarPorId(id) {
    return await prisma.exemplar.findUnique({
        where: { id: Number(id) },
        include: { livro: true }
    });
}

async function adicionarExemplar(livroId, dados) {
    const novoExemplar = await prisma.exemplar.create({
        data: {
            codigoBarras: dados.codigoBarras,
            condicao: dados.condicao || "Novo",
            disponibilidade: dados.statusDisponibilidade || "Disponivel",
            dataAquisicao: new Date(dados.dataAquisicao),
            livro: { connect: { id: Number(livroId) } }
        }
    });

    await rabbitmq.publish(rabbitmq.EVENTS.EXEMPLAR_ADICIONADO, {
        exemplarId: novoExemplar.id,
        livroId: novoExemplar.livroId,
        codigoBarras: novoExemplar.codigoBarras
    });

    return novoExemplar;
}

async function alterarStatusExemplar(id, dadosAtualizacao) {
    const exemplarAtualizado = await prisma.exemplar.update({
        where: { id: Number(id) },
        data: {
            condicao: dadosAtualizacao.condicao,
            disponibilidade: dadosAtualizacao.disponibilidade
        }
    });
 
    await rabbitmq.publish(rabbitmq.EVENTS.EXEMPLAR_ALTERADO, {
        exemplarId: exemplarAtualizado.id,
        condicao: exemplarAtualizado.condicao,
        disponibilidade: exemplarAtualizado.disponibilidade
    });
 
    return exemplarAtualizado;
}

module.exports = { listarExemplares, buscarExemplarPorId, adicionarExemplar, alterarStatusExemplar };