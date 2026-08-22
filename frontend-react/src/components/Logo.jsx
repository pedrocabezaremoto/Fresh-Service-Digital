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
      {/* Copito flota directo — sin fondo circular */}
      <span
        className={`${box} ${motion} grid shrink-0 place-items-center will-change-transform`}
      >
        <img
          src="/copito-avatar.png"
          alt="Copito — Fresh Service Digital"
          className="h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
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
