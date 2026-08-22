import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useSiteImages } from '../context/SiteImagesContext';

const INTERVAL = 5000;
const FALLBACK_ALT = 'Técnico de refrigeración trabajando';

export default function HeroCarousel() {
  const { images } = useSiteImages();
  const fallback = [{ src: images.heroTech, alt: FALLBACK_ALT }];
  const [slides, setSlides] = useState(fallback);
  const [cur, setCur] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/carousel`)
      .then((r) => r.json())
      .then((list) => {
        if (cancelled) return;
        if (Array.isArray(list) && list.length) {
          setSlides(list.map((img) => ({ src: img.url, alt: img.alt || '' })));
          setCur(0);
        } else {
          setSlides(fallback);
        }
      })
      .catch(() => { if (!cancelled) setSlides(fallback); });
    return () => { cancelled = true; };
  }, [images.heroTech]);

  const advance = useCallback(() => {
    setCur((i) => (slides.length ? (i + 1) % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) {
      clearInterval(timer.current);
      return undefined;
    }
    timer.current = setInterval(advance, INTERVAL);
    return () => clearInterval(timer.current);
  }, [advance, slides.length]);

  const goTo = (i) => {
    setCur(i);
    if (slides.length < 2) return;
    clearInterval(timer.current);
    timer.current = setInterval(advance, INTERVAL);
  };

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-glow-lg sm:h-[420px] lg:h-[min(480px,calc(100vh-14rem))]">
      {slides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${i === cur ? 'opacity-100' : 'opacity-0'}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Imagen ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === cur ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
