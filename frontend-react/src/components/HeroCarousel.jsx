import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDES = [
  { src: '/carrusel/diagnostico1.jpeg', alt: 'Diagnóstico eléctrico con multímetro' },
  { src: '/carrusel/spl1.jpeg', alt: 'Instalación de split' },
  { src: '/carrusel/ventana1.jpeg', alt: 'Reparación de aire de ventana' },
  { src: '/carrusel/tone1.jpeg', alt: 'Mantenimiento de equipo por toneladas' },
  { src: '/carrusel/diagnostico2.jpeg', alt: 'Revisión de componentes' },
  { src: '/carrusel/split-mejor.jpeg', alt: 'Servicio de split completo' },
  { src: '/carrusel/ventana2.jpeg', alt: 'Técnico en aires de ventana' },
  { src: '/carrusel/split-mal.jpeg', alt: 'Diagnóstico de split' },
];

const INTERVAL = 5000;

export default function HeroCarousel() {
  const [cur, setCur] = useState(0);
  const timer = useRef(null);

  const advance = useCallback(() => setCur(i => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    timer.current = setInterval(advance, INTERVAL);
    return () => clearInterval(timer.current);
  }, [advance]);

  const goTo = (i) => {
    setCur(i);
    clearInterval(timer.current);
    timer.current = setInterval(advance, INTERVAL);
  };

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-glow-lg sm:h-[420px] lg:h-[min(480px,calc(100vh-14rem))]">
      {SLIDES.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${i === cur ? 'opacity-100' : 'opacity-0'}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Imagen ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${i === cur ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}
