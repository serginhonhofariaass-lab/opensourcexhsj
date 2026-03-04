'use client';

import { useSettings } from '@/context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  
  return (
    <footer style={{ backgroundColor: settings?.primaryColor || '#004642' }} className="text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">{settings?.siteName || 'No Abraço do Pai'}</h3>
            <p className="font-body text-white/80 text-sm">
              Plataforma de venda de ingress para eventos religiosos e culturais.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="font-body text-white hover:text-white transition/80-colors text-sm">
                  Início
                </a>
              </li>
              <li>
                <a href="/admin" className="font-body text-white/80 hover:text-white transition-colors text-sm">
                  Admin
                </a>
              </li>
              <li>
                <a href="/termos" className="font-body text-white/80 hover:text-white transition-colors text-sm">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contato</h4>
            <ul className="space-y-2">
              {settings?.contactEmail && (
                <li className="font-body text-white/80 text-sm">
                  Email: {settings.contactEmail}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="font-body text-white/60 text-sm">
            {settings?.footerText || `© ${new Date().getFullYear()} No Abraço do Pai. Todos os direitos reservados.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
