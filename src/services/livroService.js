const prisma = require('../config/prisma');
const rabbitmq = require('../config/rabbitmq');

async function listarLivros(filtros = {}) {
    const where = {};

    if (filtros.status !== undefined){
        where.status = Number(filtros.status);
    }

    return await prisma.livro.findMany({
        where,
        // Atualizado para trazer os dados reais do Autor e Gênero através da tabela de ligação
        include: {
            autores: { include: { autor: true } },
            generos: { include: { genero: true } },
            _count: { select: { exemplares: true } }
        }
    });
}

async function buscarLivroPorId(id) {
    return await prisma.livro.findUnique({
        where: { id: Number(id) },
        include: {
            exemplares: true,
            autores: { include: { autor: true } },
            generos: { include: { genero: true } }
        }
    });
}

async function cadastrarLivro(dados) {
    // Pegando os arrays de IDs vindos da requisição (Postman). Se vier vazio, garante que não dá erro.
    const autoresIds = dados.autores || [];
    const generosIds = dados.generos || [];

    const novoLivro = await prisma.livro.create({
        data: {
            titulo: dados.titulo,
            isbn: dados.isbn,
            editora: dados.editora,
            anoPublicacao: dados.anoPublicacao,
            sinopse: dados.sinopse,
            numeroPaginas: dados.numeroPaginas,
            idioma: dados.idioma,
            status: 1,

            // Aqui fazemos a ligação com os Autores
            autores: {
                create: autoresIds.map(idAutor => ({
                    autor: { connect: { id: idAutor } }
                }))
            },

            // Aqui fazemos a ligação com os Gêneros
            generos: {
                create: generosIds.map(idGenero => ({
                    genero: { connect: { id: idGenero } }
                }))
            }
        },
        // Opcional: já retorna o livro recém-criado com os dados dos autores e gêneros embutidos
        include: {
            autores: { include: { autor: true } },
            generos: { include: { genero: true } }
        }
    });

    // Emite evento para outros microsserviços
    await rabbitmq.publish(rabbitmq.EVENTS.LIVRO_CRIADO, {
        livroId: novoLivro.id,
        titulo: novoLivro.titulo,
        isbn: novoLivro.isbn
    });

    return novoLivro;
}

async function alterarStatusLivro(id, status) {
    const livroAtualizado = await prisma.livro.update({
        where: { id: Number(id) },
        data: { status: Number(status) }
    });

    // Importante: avisa a todos que o livro mudou (ex: se foi inativado, a Reserva bloqueia)
    await rabbitmq.publish(rabbitmq.EVENTS.LIVRO_ALTERADO, {
        livroId: livroAtualizado.id,
        status: livroAtualizado.status
    });

    return livroAtualizado;
}

module.exports = { listarLivros, buscarLivroPorId, cadastrarLivro, alterarStatusLivro };