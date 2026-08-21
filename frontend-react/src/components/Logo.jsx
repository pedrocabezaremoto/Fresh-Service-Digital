export default function Logo({ size = 'md', light = false, effect = 'hover' }) {
  const box = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-14 w-14' : 'h-12 w-12';
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
        className={`${box} ${motion} grid shrink-0 place-items-center rounded-xl bg-white/10 p-0.5 will-change-transform`}
      >
        <img
          src="/copito-avatar.png"
          alt="Copito — Fresh Service Digital"
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
