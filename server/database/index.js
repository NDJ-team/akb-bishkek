/**
 * Единая точка доступа к Prisma Client.
 * Импортируется из всех контроллеров.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
