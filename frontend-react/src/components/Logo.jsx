import { Snowflake } from 'lucide-react';

export default function Logo({ size = 'md', light = false }) {
  const box = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const icon = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const text = size === 'lg' ? 'text-xl' : 'text-base';
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} grid place-items-center rounded-xl bg-brand-gradient-bright text-white shadow-glow sheen`}
      >
        <Snowflake size={icon} strokeWidth={2.2} />
      </div>
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
