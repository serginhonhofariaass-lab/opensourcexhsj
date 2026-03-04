'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check if user already has a persistent cookie
    const checkExistingSession = async () => {
      try {
        const response = await fetch('/api/user/session', {
          method: 'GET',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.email) {
            router.push('/minhas-compras');
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };
    checkExistingSession();
  }, [router]);

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, insira seu e-mail');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Save session - either persistent (30 days) or session (browser close)
        if (rememberMe) {
          setCookie('userEmail', email, 30);
        } else {
          // Session cookie - expires when browser closes
          document.cookie = `userEmail=${email};path=/;SameSite=Lax`;
        }
        router.push('/minhas-compras');
      } else {
        setError('E-mail não encontrado. Use o e-mail utilizado na compra.');
      }
    } catch (e) {
      // If API fails, allow access anyway (for backward compatibility)
      if (rememberMe) {
        setCookie('userEmail', email, 30);
      } else {
        document.cookie = `userEmail=${email};path=/;SameSite=Lax`;
      }
      router.push('/minhas-compras');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-heading font-bold text-3xl text-primary">
              No Abraço do Pai
            </h1>
          </Link>
          <p className="font-body text-text-secondary mt-2">
            Acesse seus ingressvos
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-sm text-text-secondary mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-button font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="rememberMe" className="ml-2 font-body text-sm text-text-secondary">
                Lembrar e-mail por 30 dias
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-body">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-button font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-sm text-text-secondary">
              Não tem uma conta?{' '}
              <span className="text-primary font-semibold">
                Use o e-mail utilizado na compra
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="font-body text-sm text-primary hover:underline">
            ← Voltar para Início
          </Link>
        </div>
      </div>
    </main>
  );
}
