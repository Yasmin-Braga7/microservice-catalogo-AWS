
const jwt = require('jsonwebtoken');

// Mesma chave usada pelo microsserviço de Usuário
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_biblioteca_2026';

/**
 * Verifica o token JWT do header Authorization: Bearer <token>
 * Em caso de sucesso, injeta `request.usuario = { id, tipo }` para uso no controller.
 */
async function verificarToken(request, reply) {
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            erro: 'Acesso negado. Token não fornecido.',
            code: 'TOKEN_AUSENTE'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.usuario = decoded; // { id, tipo, iat, exp }
    } catch (err) {
        return reply.status(401).send({
            erro: 'Token inválido ou expirado.',
            code: 'TOKEN_INVALIDO'
        });
    }
}

/**
 * Middleware que exige que o usuário seja do tipo 'Funcionario' ou 'Admin'.
 * Usar após verificarToken.
 */
async function exigirFuncionario(request, reply) {
    if (!request.usuario) {
        return reply.status(401).send({ erro: 'Não autenticado.', code: 'NAO_AUTENTICADO' });
    }
    const tiposPermitidos = ['Funcionario', 'Admin', 'admin', 'funcionario'];
    if (!tiposPermitidos.includes(request.usuario.tipo)) {
        return reply.status(403).send({
            erro: 'Acesso restrito a funcionários.',
            code: 'ACESSO_NEGADO'
        });
    }
}

module.exports = { verificarToken, exigirFuncionario };