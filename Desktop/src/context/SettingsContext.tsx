'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SiteSettings {
  id: string;
  siteName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  footerText: string | null;
  contactEmail: string | null;
  heroTitle: string;
  heroSubtitle: string;
  mpAccessToken?: string;
}

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  id: '',
  siteName: 'No Abraço do Pai',
  logoUrl: null,
  primaryColor: '#004642',
  secondaryColor: '#E5D4C8',
  backgroundColor: '#FFFFFF',
  textColor: '#1A1A1A',
  footerText: null,
  contactEmail: null,
  heroTitle: 'Criado para promover suas experiências',
  heroSubtitle: 'Descubra os melhores eventos religiosos e culturais perto de você',
  mpAccessToken: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  updateSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setSettings(defaultSettings);
        setLoading(false);
      });
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    setSettings(data);
  };

  return (
    <SettingsContext.Provider value={{ settings: settings || defaultSettings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
