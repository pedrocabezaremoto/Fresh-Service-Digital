import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isAdmin, isTechnician, user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/catalogo', label: 'Servicios' },
    { to: '/solicitud', label: 'Solicitar' },
  ];

  const panelLink = isAdmin ? '/admin' : isTechnician ? '/tecnico' : '/panel';

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold uppercase tracking-wide transition-colors ${
      isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'
    }`;

  function handleLogout() {
    logout();
    navigate('/');
    setOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="Inicio">
          <Logo />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-brand-50 transition-colors cursor-pointer"
          >
            {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-brand-700" />}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                to={panelLink}
                className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg hover:brightness-105 sheen"
              >
                <LayoutDashboard size={16} />
                {isAdmin ? 'Panel Taller' : isTechnician ? 'Panel Técnico' : 'Mi Panel'}
              </Link>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg hover:brightness-105 sheen cursor-pointer"
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg hover:brightness-105 sheen"
            >
              Iniciar sesión <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-700 cursor-pointer"
          >
            {isDark ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-brand-700" />}
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-slate-100 bg-white px-5 pb-6 pt-2 shadow-lg lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={panelLink}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-bold text-white shadow-glow sheen"
                  >
                    <LayoutDashboard size={16} />
                    {isAdmin ? 'Panel del Taller' : isTechnician ? 'Panel Técnico' : 'Mi Panel'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-bold text-white shadow-glow sheen cursor-pointer"
                  >
                    <LogOut size={16} />
                    Salir
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-bold text-white shadow-glow sheen"
                >
                  Iniciar sesión <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
