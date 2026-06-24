import { Link } from 'react-router-dom';
import {
  Snowflake, Wrench, Wind, ShieldCheck, Zap, Clock, MapPin, Star,
  ArrowRight, CheckCircle2, PhoneCall, Award, ThermometerSnowflake,
} from 'lucide-react';
import Button from '../components/Button';
import { IMG } from '../lib/images';

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-extrabold text-white sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-brand-200">{label}</div>
    </div>
  );
}

const services = [
  {
    icon: Wind, title: 'Aires de Ventana', img: IMG.maintenance,
    desc: 'Reparación, mantenimiento e instalación de unidades de ventana de todas las marcas.',
    points: ['Diagnóstico incluido', 'Recarga de gas', 'Limpieza profunda'],
  },
  {
    icon: ThermometerSnowflake, title: 'Aires Split', img: IMG.install,
    desc: 'Servicio integral para sistemas Split mini y maxi: unidad interna y externa.',
    points: ['Lavado a presión', 'Revisión de plaquetas', 'Recarga y hermeticidad'],
  },
  {
    icon: Wrench, title: 'Aires por Toneladas', img: IMG.repair,
    desc: 'Equipos de 1 a 3 toneladas para locales y espacios grandes. Servicio especializado.',
    points: ['Hasta 80 m²', 'Línea trifásica', 'Diagnóstico de compresor'],
  },
];

const features = [
  { icon: Zap, title: 'Respuesta el mismo día', desc: 'Agendas tu cita en minutos por la plataforma. El técnico llega en el horario que elijas.' },
  { icon: Award, title: 'Técnicos certificados', desc: 'Equipo con formación especializada y años de experiencia en refrigeración.' },
  { icon: ShieldCheck, title: 'Servicio garantizado', desc: 'Todos los trabajos incluyen garantía. Si algo falla, regresamos sin costo.' },
  { icon: MapPin, title: 'A domicilio', desc: 'Vamos hasta tu casa o local en San Juan de los Morros y alrededores.' },
];

const steps = [
  { n: '01', title: 'Solicita en línea', desc: 'Elige el servicio y cuéntanos qué necesitas.' },
  { n: '02', title: 'Coordinamos por WhatsApp', desc: 'Confirmamos fecha y hora que te convengan.' },
  { n: '03', title: 'El técnico llega', desc: 'Puntual y con las herramientas necesarias.' },
  { n: '04', title: 'Trabajo garantizado', desc: 'Pagas al finalizar, con garantía incluida.' },
];

const testimonials = [
  { name: 'Yolanda T.', area: 'Urb. Las Mercedes', text: 'Vinieron el mismo día, repararon mi split que no enfriaba y quedó como nuevo. Excelente trato.' },
  { name: 'Carlos S.', area: 'Centro', text: 'Mantenimiento de los aires de mi local. Profesionales, puntuales y precio justo. Recomendados.' },
  { name: 'Ana M.', area: 'La Morera', text: 'Me encantó poder agendar por internet sin tantas llamadas. El técnico súper amable y rápido.' },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative bg-brand-950">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-frost-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-100 ring-1 ring-white/15">
              <Snowflake size={14} /> Refrigeración a domicilio
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Tu clima ideal,<br />
              <span className="text-gradient">sin complicaciones.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-brand-100/80">
              Reparación, mantenimiento e instalación de aires acondicionados a
              domicilio en San Juan de los Morros. Agenda en minutos, técnicos
              certificados y garantía en cada visita.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/solicitud" size="lg" variant="bright">
                Solicitar servicio <ArrowRight size={18} />
              </Button>
              <Button to="/catalogo" size="lg" variant="ghostWhite">
                Ver servicios
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-100/80">
              {['Técnicos certificados', 'Garantía incluida', 'Respuesta el mismo día'].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-frost-300" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-glow-lg">
              <img
                src={IMG.heroTech}
                alt="Técnico de refrigeración trabajando"
                className="h-[420px] w-full object-cover sm:h-[480px]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />
            </div>
            {/* Floating cards */}
            <div className="absolute -left-4 top-8 flex items-center gap-3 rounded-2xl glass px-4 py-3 shadow-xl sm:-left-8">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">+1.200 servicios</div>
                <div className="text-xs text-ink-500">completados</div>
              </div>
            </div>
            <div className="absolute -bottom-5 right-2 flex items-center gap-3 rounded-2xl glass px-4 py-3 shadow-xl sm:right-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-500">
                <Star size={22} fill="currentColor" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">4.9 / 5</div>
                <div className="text-xs text-ink-500">satisfacción</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4 lg:px-8">
            <Stat value="+1.200" label="Servicios" />
            <Stat value="8 años" label="Experiencia" />
            <Stat value="< 2h" label="Respuesta" />
            <Stat value="4.9★" label="Calificación" />
          </div>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Nuestros servicios</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Todo lo que tu aire necesita
            </h2>
            <p className="mt-4 text-ink-500">
              Especialistas en climatización para hogares y locales. Para todas las marcas.
            </p>
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <div className="relative h-48 overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/10 to-transparent" />
                  <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/90 text-brand-600 shadow-lg backdrop-blur">
                    <s.icon size={22} />
                  </div>
                  <h3 className="absolute bottom-3 left-4 font-display text-xl font-bold text-white">{s.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-ink-500">{s.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm font-medium text-ink-700">
                        <CheckCircle2 size={16} className="text-brand-500" /> {p}
                      </li>
                    ))}
                  </ul>
                  <Link to="/catalogo" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition hover:gap-2.5">
                    Explorar <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ NOSOTROS ===== */}
      <section className="bg-brand-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="relative">
              <img src={IMG.technician} alt="Técnico certificado" loading="lazy" className="rounded-3xl object-cover shadow-xl ring-1 ring-white" />
              <div className="absolute -bottom-6 -right-4 hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-glow-lg sm:block">
                <Award size={26} />
                <div className="mt-2 font-display text-lg font-extrabold leading-none">8 años</div>
                <div className="text-xs text-brand-100">de experiencia</div>
              </div>
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-brand-600">¿Por qué Fresh Service?</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Profesionales en quienes confiar
              </h2>
              <p className="mt-4 text-ink-500">
                Combinamos experiencia técnica con una plataforma digital que hace
                pedir un servicio tan fácil como enviar un mensaje.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow sheen">
                      <f.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink-900">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Así de fácil</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Tu servicio en 4 pasos
            </h2>
          </div>
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-brand-50/60 p-6 ring-1 ring-brand-100">
                <div className="font-display text-4xl font-extrabold text-brand-200">{s.n}</div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <section className="bg-brand-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Clientes felices</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Lo que dicen de nosotros
            </h2>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-3xl bg-white p-7 ring-1 ring-slate-100 shadow-sm">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="mt-4 leading-relaxed text-ink-700">“{t.text}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink-900">{t.name}</div>
                    <div className="text-xs text-ink-500">{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-8 py-14 text-center shadow-glow-lg sm:px-16">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <Snowflake className="absolute right-8 top-8 text-white/15" size={120} />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                ¿Tu aire no enfría como antes?
              </h2>
              <p className="mt-4 text-lg text-brand-50/90">
                Agenda hoy mismo. Un técnico te visita en menos de 2 horas hábiles.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button to="/solicitud" size="lg" variant="dark">
                  <PhoneCall size={18} /> Solicitar ahora
                </Button>
                <Button to="/registro" size="lg" variant="ghostWhite">
                  Crear cuenta gratis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
