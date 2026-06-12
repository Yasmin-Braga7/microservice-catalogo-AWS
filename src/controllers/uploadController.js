const prisma = require('../config/prisma');

const MIME_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// POST /livros/:id/capa
async function uploadCapa(request, reply) {
    const { id } = request.params;

    const livro = await prisma.livro.findUnique({ where: { id: Number(id) } });
    if (!livro) {
        return reply.status(404).send({ erro: 'Livro não encontrado.' });
    }

    const data = await request.file();
    if (!data) {
        return reply.status(400).send({ erro: 'Nenhum arquivo enviado.' });
    }

    if (!MIME_PERMITIDOS.includes(data.mimetype)) {
        return reply.status(400).send({ erro: 'Formato inválido. Use JPEG, PNG ou WebP.' });
    }

    // Lê todos os chunks e monta o Buffer
    const chunks = [];
    let tamanho = 0;
    for await (const chunk of data.file) {
        tamanho += chunk.length;
        if (tamanho > TAMANHO_MAX_BYTES) {
            return reply.status(400).send({ erro: 'Arquivo muito grande. Máximo: 5 MB.' });
        }
        chunks.push(chunk);
    }
    const bytesImagem = Buffer.concat(chunks);

    // Extensão a partir do mimetype
    const extMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    };
    const extensao = extMap[data.mimetype];

    // Monta a string Base64 com prefixo (igual ao seu projeto Spring)
    const base64 = bytesImagem.toString('base64');
    const base64ComPrefixo = `data:${data.mimetype};base64,${base64}`;

    // Salva no banco como Buffer (Bytes no Prisma = Buffer no Node)
    await prisma.livro.update({
        where: { id: Number(id) },
        data: {
            imagem: Buffer.from(base64ComPrefixo, 'utf-8'),
            extensao,
            imagemNome: data.filename || `capa.${extensao}`,
        },
    });

    return reply.status(201).send({ mensagem: 'Capa enviada com sucesso.' });
}

// GET /livros/:id/capa
async function exibirCapa(request, reply) {
    const { id } = request.params;

    const livro = await prisma.livro.findUnique({ where: { id: Number(id) } });
    if (!livro || !livro.imagem) {
        return reply.status(404).send({ erro: 'Imagem não encontrada.' });
    }

    const extensao = (livro.extensao || 'jpg').toLowerCase();
    const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const contentType = mimeMap[extensao] || 'application/octet-stream';

    // Decodifica o Base64 de volta para bytes puros (igual ao seu Controller Spring)
    const base64String = livro.imagem.toString('utf-8');
    const base64SemPrefixo = base64String.substring(base64String.indexOf(',') + 1);
    const imagemBytes = Buffer.from(base64SemPrefixo, 'base64');

    return reply
        .status(200)
        .header('Content-Type', contentType)
        .header('Content-Disposition', `inline; filename="${livro.imagemNome || 'capa.' + extensao}"`)
        .header('Cache-Control', 'no-cache')
        .send(imagemBytes);
}

// DELETE /livros/:id/capa
async function deletarCapa(request, reply) {
    const { id } = request.params;

    const livro = await prisma.livro.findUnique({ where: { id: Number(id) } });
    if (!livro) {
        return reply.status(404).send({ erro: 'Livro não encontrado.' });
    }
    if (!livro.imagem) {
        return reply.status(404).send({ erro: 'Este livro não possui capa cadastrada.' });
    }

    await prisma.livro.update({
        where: { id: Number(id) },
        data: { imagem: null, extensao: null, imagemNome: null },
    });

    return reply.status(200).send({ mensagem: 'Capa removida com sucesso.' });
}

module.exports = { uploadCapa, exibirCapa, deletarCapa };
