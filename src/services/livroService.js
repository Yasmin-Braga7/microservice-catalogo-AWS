const prisma = require('../config/prisma');
const rabbitmq = require('../config/rabbitmq');

async function listarLivros(filtros = {}) {
    const where = {};

    if (filtros.status !== undefined){
        where.status = Number(filtros.status);
    }

    return await prisma.livro.findMany({
        where,
        select: {
            id: true,
            titulo: true,
            isbn: true,
            editora: true,
            anoPublicacao: true,
            sinopse: true,
            numeroPaginas: true,
            idioma: true,
            status: true,
            imagemNome: true,   // mantido: só o nome do arquivo, não os bytes
            extensao: true,     // mantido: só a extensão, útil pro <img src>
            // imagem: NÃO incluído de propósito — é o campo pesado
            autores: { include: { autor: true } },
            generos: { include: { genero: true } },
            exemplares: true,
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

async function editarLivro(id, dados) {
    const autoresIds = dados.autores || [];
    const generosIds = dados.generos || [];

    const livroAtualizado = await prisma.$transaction(async (tx) => {
        // 1. Atualiza os campos básicos do livro
        await tx.livro.update({
            where: { id: Number(id) },
            data: {
                titulo: dados.titulo,
                isbn: dados.isbn,
                editora: dados.editora,
                anoPublicacao: dados.anoPublicacao,
                sinopse: dados.sinopse,
                numeroPaginas: dados.numeroPaginas,
                idioma: dados.idioma,
            },
        });

        // 2. Recria as associações de autores (deleta todas e insere as novas)
        if (dados.autores !== undefined) {
            await tx.livroAutor.deleteMany({ where: { livroId: Number(id) } });
            if (autoresIds.length > 0) {
                await tx.livroAutor.createMany({
                    data: autoresIds.map((idAutor) => ({
                        livroId: Number(id),
                        autorId: idAutor,
                    })),
                });
            }
        }

        // 3. Recria as associações de gêneros (deleta todas e insere as novas)
        if (dados.generos !== undefined) {
            await tx.livroGenero.deleteMany({ where: { livroId: Number(id) } });
            if (generosIds.length > 0) {
                await tx.livroGenero.createMany({
                    data: generosIds.map((idGenero) => ({
                        livroId: Number(id),
                        generoId: idGenero,
                    })),
                });
            }
        }

        // 4. Retorna o livro atualizado com includes
        return tx.livro.findUnique({
            where: { id: Number(id) },
            include: {
                autores: { include: { autor: true } },
                generos: { include: { genero: true } },
            },
        });
    });

    // Emite evento para outros microsserviços
    await rabbitmq.publish(rabbitmq.EVENTS.LIVRO_ALTERADO, {
        livroId: livroAtualizado.id,
        titulo: livroAtualizado.titulo,
        isbn: livroAtualizado.isbn,
    });

    return livroAtualizado;
}

module.exports = { listarLivros, buscarLivroPorId, cadastrarLivro, alterarStatusLivro, editarLivro };
