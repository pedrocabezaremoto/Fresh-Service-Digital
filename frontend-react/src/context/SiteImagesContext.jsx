import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchSiteImageMap, IMG, mergeSiteImages } from '../lib/images';

const SiteImagesContext = createContext({
  images: IMG,
  customs: {},
  reload: async () => {},
});

export function SiteImagesProvider({ children }) {
  const [images, setImages] = useState(IMG);
  const [customs, setCustoms] = useState({});

  const reload = useCallback(async () => {
    try {
      const map = await fetchSiteImageMap();
      setCustoms(map);
      setImages(mergeSiteImages(map));
    } catch {
      setCustoms({});
      setImages(IMG);
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
