/**
 * Seed de datos de demostración — Fresh Service Digital
 * Crea clientes venezolanos realistas con citas en distintos estados,
 * marcas comunes de aires acondicionados y fechas repartidas en varios meses
 * para que el panel del taller (estadísticas y gráficos) tenga sentido.
 *
 * Uso:  node prisma/seed.js
 * Las contraseñas usan SHA-256 (igual que el servicio de usuarios). Clave demo: Demo1234
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Operadoras venezolanas
const ops = ['412', '414', '424', '416', '426'];
const rndPhone = () =>
  `+58${ops[Math.floor(Math.random() * ops.length)]}${Math.floor(1000000 + Math.random() * 8999999)}`;

const clientes = [
  { firstName: 'María',   lastName: 'Rodríguez', email: 'maria.rodriguez@gmail.com' },
  { firstName: 'José',    lastName: 'González',  email: 'jose.gonzalez@hotmail.com' },
  { firstName: 'Carmen',  lastName: 'Pérez',     email: 'carmen.perez@gmail.com' },
  { firstName: 'Luis',    lastName: 'Hernández', email: 'luis.hernandez@gmail.com' },
  { firstName: 'Ana',     lastName: 'Martínez',  email: 'ana.martinez@outlook.com' },
  { firstName: 'Pedro',   lastName: 'Ramírez',   email: 'pedro.ramirez@gmail.com' },
  { firstName: 'Rosa',    lastName: 'Díaz',      email: 'rosa.diaz@gmail.com' },
  { firstName: 'Carlos',  lastName: 'Sánchez',   email: 'carlos.sanchez@hotmail.com' },
  { firstName: 'Yolanda', lastName: 'Torres',    email: 'yolanda.torres@gmail.com' },
  { firstName: 'Miguel',  lastName: 'Flores',    email: 'miguel.flores@gmail.com' },
];

// Marcas y modelos reales que se ven en Venezuela
const equipos = [
  { brand: 'LG',        model: 'Dual Inverter',   btu: 12000 },
  { brand: 'Samsung',   model: 'WindFree',        btu: 18000 },
  { brand: 'Carrier',   model: 'XPower',          btu: 24000 },
  { brand: 'Frigilux',  model: 'Split FRA-12',    btu: 12000 },
  { brand: 'Premium',   model: 'PAC-09',          btu: 9000 },
  { brand: 'Midea',     model: 'Xtreme Save',     btu: 18000 },
  { brand: 'Mabe',      model: 'MMI12CDBWCA',     btu: 12000 },
  { brand: 'Daewoo',    model: 'DWC-1800',        btu: 18000 },
  { brand: 'York',      model: 'YHKE12',          btu: 12000 },
  { brand: 'Whirlpool', model: 'Ventana 5000',    btu: 5000 },
];

const fallas = [
  'No enfría, posible fuga de gas refrigerante',
  'Hace ruido fuerte al encender, revisar compresor',
  'Bota agua dentro de la habitación, drenaje tapado',
  'Mantenimiento preventivo y limpieza de filtros',
  'El control remoto no responde, no enciende',
  'Enfría poco, requiere recarga de gas',
  'Tablero electrónico dañado tras bajón de luz',
  'Olor a humedad, limpieza profunda del serpentín',
  'Vibración excesiva en la unidad externa',
  'Instalación nueva de equipo split',
];

const estados = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'CANCELLED'];
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Reparte fechas entre febrero y junio 2026
function fechaEnMes(monthOffsetFromJun) {
  const base = new Date(2026, 5, 23); // junio = mes 5
  base.setMonth(base.getMonth() - monthOffsetFromJun);
  base.setDate(1 + Math.floor(Math.random() * 26));
  base.setHours(8 + Math.floor(Math.random() * 9), rnd([0, 30]), 0, 0);
  return base;
}

async function main() {
  console.log('🌱 Sembrando datos de demo...');

  // Hash bcrypt de la clave demo (igual para todos los usuarios sembrados)
  const PASS = await bcrypt.hash('Demo1234', 10);
  const ADMIN_PASS = await bcrypt.hash('Admin1234', 10);

  // Limpiar datos previos (citas/equipos caen en cascada al borrar usuarios)
  await prisma.user.deleteMany({});
  console.log('   🧹 Datos previos eliminados');

  // Usuario ADMIN del taller (para entrar al dashboard administrativo)
  await prisma.user.create({
    data: {
      email: 'admin@freshservice.com',
      password: ADMIN_PASS,
      firstName: 'Admin',
      lastName: 'Taller',
      phone: '+584140000000',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('   👑 Admin creado: admin@freshservice.com / Admin1234');

  for (const c of clientes) {
    const existing = await prisma.user.findUnique({ where: { email: c.email } });
    if (existing) {
      console.log(`   • ${c.email} ya existe, se omite`);
      continue;
    }

    const createdAt = fechaEnMes(Math.floor(Math.random() * 5)); // alta repartida
    const user = await prisma.user.create({
      data: {
        email: c.email,
        password: PASS,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: rndPhone(),
        role: 'CLIENT',
        isVerified: true,
        createdAt,
      },
    });

    // 1 a 4 citas por cliente
    const nCitas = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < nCitas; i++) {
      const eq = rnd(equipos);
      const mes = Math.floor(Math.random() * 5);
      const fecha = fechaEnMes(mes);
      await prisma.appointment.create({
        data: {
          clientId: user.id,
          status: rnd(estados),
          scheduledAt: fecha,
          createdAt: fecha,
          notes: rnd(fallas),
          equipment: {
            create: {
              brand: eq.brand,
              model: eq.model,
              btuCapacity: eq.btu,
              serialNumber: `SN-${Math.floor(100000 + Math.random() * 899999)}`,
              failureDescription: rnd(fallas),
            },
          },
        },
      });
    }
    console.log(`   ✓ ${c.firstName} ${c.lastName} (${nCitas} citas)`);
  }

  const totU = await prisma.user.count({ where: { role: 'CLIENT' } });
  const totA = await prisma.appointment.count();
  console.log(`✅ Listo. Clientes: ${totU} · Citas: ${totA}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
