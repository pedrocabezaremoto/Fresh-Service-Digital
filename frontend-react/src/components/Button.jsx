import { Link } from 'react-router-dom';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer min-h-11 touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:brightness-95 sheen',
  bright:
    'bg-brand-gradient-bright text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:brightness-95 sheen',
  outline:
    'border-2 border-brand-200 text-brand-700 bg-white hover:border-brand-400 hover:bg-brand-50 active:border-brand-400 active:bg-brand-50',
  ghostWhite:
    'border border-white/40 text-white bg-white/10 backdrop-blur hover:bg-white/20 active:bg-white/20',
  dark: 'bg-brand-950 text-white hover:bg-brand-900 active:bg-brand-900',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-[0.95rem]',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({
  as = 'button',
  to,
  href,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
