import { useState, useEffect, createContext, useContext } from 'react';
import { API_BASE } from '../lib/api';

/** Tasa oficial BCV (USD→Bs). Se carga una sola vez al abrir la app. */
const RateContext = createContext({ rate: null, date: null });

export function RateProvider({ children }) {
  const [data, setData] = useState({ rate: null, date: null });

  useEffect(() => {
    fetch(`${API_BASE}/rate`)
      .then((r) => r.json())
      .then((d) => setData({ rate: d.rate, date: d.date }))
      .catch(() => {
        /* si falla, los precios se muestran en USD (fallback en Price) */
      });
  }, []);

  return <RateContext.Provider value={data}>{children}</RateContext.Provider>;
}

export const useRate = () => useContext(RateContext);
