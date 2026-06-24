/* Imágenes de stock (Unsplash) verificadas y relevantes para refrigeración.
   Hotlink permitido. Parámetros de Unsplash para optimizar tamaño/calidad. */
const U = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  technician: U('photo-1621905251918-48416bd8575a', 1000), // técnico con casco trabajando
  repair: U('photo-1504328345606-18bbc8c9d7d1', 900), // reparación / chispas
  maintenance: U('photo-1581578731548-c64695cc6952', 900), // limpieza / mantenimiento
  install: U('photo-1607400201515-c2c41c07d307', 900), // instalación / sellado
  comfort: U('photo-1599696848652-f0ff23bc911f', 1200), // interior confortable
  appliance: U('photo-1565538810643-b5bdb714032a', 900), // electrodoméstico (neveras)
  heroTech: U('photo-1621905251918-48416bd8575a', 1300),
};
