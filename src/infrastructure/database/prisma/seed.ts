import { PerfilAcesso, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = 'admin@oficina.local';
  const existing = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin já existe, seed ignorado.');
    return;
  }
  const senhaHash = await bcrypt.hash('admin123', 12);
  await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: adminEmail,
      senha: senhaHash,
      perfil: PerfilAcesso.ADMINISTRADOR,
    },
  });
  console.log('Administrador criado: admin@oficina.local / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
