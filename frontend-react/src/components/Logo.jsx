export default function Logo({ size = 'md', light = false, effect = 'hover' }) {
  const box = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const text = size === 'lg' ? 'text-xl' : 'text-base';

  // hover: reacciona al mouse (navbar) · float: bob lento continuo (footer)
  const motion =
    effect === 'float'
      ? 'animate-logo-float'
      : 'transition duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.06] hover:shadow-md hover:ring-brand-200';

  return (
    <div className="flex items-center gap-2.5">
      {/* Chip blanco fijo para que el logo se vea bien en navbar claro y oscuro */}
      <span
        className={`${box} ${motion} grid shrink-0 place-items-center rounded-xl bg-[#ffffff] p-1 shadow-sm ring-1 ring-slate-200/80 will-change-transform`}
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
