'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';
import { useEffect, useState } from 'react';
import { Ticket } from 'lucide-react';

export default function Header() {
  const { settings } = useSettings();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setIsLoggedIn(!!email);
  }, []);
  
  return (
    <header className="sticky top-[48px] z-50 bg-white shadow-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              {settings?.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={settings.siteName || 'Logo'}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=100&h=100&fit=crop"
                  alt={settings?.siteName || 'No Abraço do Pai'}
                  fill
                  className="rounded-full object-cover"
                />
              )}
            </div>
            <span className="font-heading font-bold text-lg" style={{ color: settings?.primaryColor || '#004642' }}>
              {settings?.siteName || 'No Abraço do Pai'}
            </span>
          </Link>

          {/* Navigation - Hidden on mobile, visible on desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="font-body hover:opacity-80 transition-colors"
              style={{ color: settings?.textColor || '#1A1A1A' }}
            >
              Início
            </Link>
            {isLoggedIn && (
              <Link 
                href="/minhas-compras" 
                className="font-body hover:opacity-80 transition-colors flex items-center gap-1"
                style={{ color: settings?.textColor || '#1A1A1A' }}
              >
                <Ticket className="w-4 h-4" />
                Minhas Compras
              </Link>
            )}
            {!isLoggedIn && (
              <Link 
                href="/login" 
                className="font-body hover:opacity-80 transition-colors"
                style={{ color: settings?.textColor || '#1A1A1A' }}
              >
                Entrar
              </Link>
            )}
            <Link 
              href="/admin" 
              className="font-body hover:opacity-80 transition-colors"
              style={{ color: settings?.textColor || '#1A1A1A' }}
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
