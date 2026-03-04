'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously closed
    const bannerClosed = localStorage.getItem('cookieBannerClosed');
    if (!bannerClosed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('cookieBannerClosed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-cookie-yellow px-4 py-3 animate-slideDown">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-text-primary text-sm font-medium">
          Utilizamos cookies para melhorar sua experiência e oferecer conteúdos personalizados.{' '}
          <a href="/termos" className="underline hover:text-primary">
            Leia nossos termos de uso
          </a>
        </p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-text-primary" />
        </button>
      </div>
    </div>
  );
}
