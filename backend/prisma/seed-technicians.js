/**
 * Siembra (idempotente) los 3 técnicos del taller.
 * NO borra nada: usa upsert por email. Se puede correr las veces que quieras.
 *
 *   node prisma/seed-technicians.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const TECNICOS = [
  { email: 'juan.tecnico@freshservice.com',   firstName: 'Juan',   lastName: 'Aires de Ventana', phone: '+58 412-111 2233', specialty: 'Aires de Ventana' },
  { email: 'carlos.tecnico@freshservice.com', firstName: 'Carlos', lastName: 'Aires Split',      phone: '+58 414-222 3344', specialty: 'Aires Split' },
  { email: 'jorge.tecnico@freshservice.com',  firstName: 'Jorge',  lastName: 'General',          phone: '+58 424-333 4455', specialty: 'General' },
];

async function main() {
  const password = await bcrypt.hash('Tecnico1234', 10);
  for (const t of TECNICOS) {
    await prisma.user.upsert({
      where: { email: t.email },
      update: { firstName: t.firstName, lastName: t.lastName, phone: t.phone, role: 'TECHNICIAN', isVerified: true, specialty: t.specialty, isActive: true },
      create: { ...t, password, role: 'TECHNICIAN', isVerified: true },
    });
    console.log('✔ técnico listo:', t.firstName, t.lastName, t.phone);
  }
  const total = await prisma.user.count({ where: { role: 'TECHNICIAN' } });
  console.log(`\nTotal técnicos en DB: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
