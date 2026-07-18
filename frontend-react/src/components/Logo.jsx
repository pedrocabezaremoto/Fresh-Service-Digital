export default function Logo({ size = 'md', light = false }) {
  const box = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const text = size === 'lg' ? 'text-xl' : 'text-base';
  return (
    <div className="flex items-center gap-2.5">
      {/* Chip blanco fijo para que el logo se vea bien en navbar claro y oscuro */}
      <span
        className={`${box} grid shrink-0 place-items-center rounded-xl bg-[#ffffff] p-1 shadow-sm ring-1 ring-slate-200/80`}
      >
        <img
          src="/logo.png"
          alt="Fresh Service — Refrigeración a domicilio"
          className="h-full w-full object-contain"
        />
      </span>
      <span
        className={`font-display font-extrabold ${text} tracking-tight ${
          light ? 'text-white' : 'text-brand-950'
        }`}
      >
        Fresh<span className="text-brand-500"> Service</span>
      </span>
    </div>
  );
}
