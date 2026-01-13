import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './db';
import { IMAGES } from '../constants';

interface ConfigContextType {
  logoUrl: string;
  updateLogo: (newUrl: string) => void;
  isLoadingConfig: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(IMAGES.LOGO);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    // Carregar configuração inicial
    const loadConfig = async () => {
      try {
        const storedLogo = await db.getSiteConfig('logo_url');
        if (storedLogo) {
          setLogoUrl(storedLogo);
        }
      } catch (e) {
        console.error("Erro ao carregar configurações do site", e);
        // Mantém a logo padrão em caso de erro
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  const updateLogo = (newUrl: string) => {
    setLogoUrl(newUrl);
  };

  return (
    <ConfigContext.Provider value={{ logoUrl, updateLogo, isLoadingConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};