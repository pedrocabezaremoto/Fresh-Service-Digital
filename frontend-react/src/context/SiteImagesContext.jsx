import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchSiteImageMap, IMG, mergeSiteImages } from '../lib/images';

const CACHE_KEY = 'fsd_site_images';

const SiteImagesContext = createContext({
  images: IMG,
  customs: {},
  reload: async () => {},
});

function readCachedCustoms() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const initialCustoms = cached ? JSON.parse(cached) : {};
    return initialCustoms && typeof initialCustoms === 'object' && !Array.isArray(initialCustoms)
      ? initialCustoms
      : {};
  } catch {
    return {};
  }
}

export function SiteImagesProvider({ children }) {
  const [customs, setCustoms] = useState(readCachedCustoms);
  const [images, setImages] = useState(() => {
    const initialCustoms = readCachedCustoms();
    return Object.keys(initialCustoms).length ? mergeSiteImages(initialCustoms) : IMG;
  });

  const reload = useCallback(async () => {
    try {
      const map = await fetchSiteImageMap();
      localStorage.setItem(CACHE_KEY, JSON.stringify(map));
      setCustoms(map);
      setImages(mergeSiteImages(map));
    } catch {
      const fallback = readCachedCustoms();
      if (Object.keys(fallback).length) {
        setCustoms(fallback);
        setImages(mergeSiteImages(fallback));
      } else {
        setCustoms({});
        setImages(IMG);
      }
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <SiteImagesContext.Provider value={{ images, customs, reload }}>
      {children}
    </SiteImagesContext.Provider>
  );
}

export const useSiteImages = () => useContext(SiteImagesContext);
