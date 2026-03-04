'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Ticket, User, Mail, Phone, Barcode, Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { useEffect, useState, useRef } from 'react';

interface TicketData {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  ticketCode?: string;
  mercadoPagoId?: string;
  event: {
    title: string;
    date: Date;
    location: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticketId');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const checkPaymentStatus = async () => {
    if (!ticketId) return;

    try {
      // Fetch ticket from local DB using the ID (ticketId parameter is actually the ticket ID)
      const res = await fetch(`/api/tickets/${ticketId}`);
      const data = await res.json();
      
      if (data && data.id) {
        setTicket(data);
        
        if (data.status === 'approved') {
          setLoading(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          return true;
        } else {
          // Still pending, keep checking
          setCheckingPayment(true);
        }
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
    
    return false;
  };

  useEffect(() => {
    if (ticketId) {
      // Initial check
      checkPaymentStatus();
      
      // Start polling - check every 3 seconds
      pollingRef.current = setInterval(async () => {
        const isApproved = await checkPaymentStatus();
        if (isApproved) {
          setCheckingPayment(false);
        } else {
          // Only show checking if we're still pending
          setTicket(currentTicket => {
            if (currentTicket?.status !== 'approved') {
              setCheckingPayment(true);
            }
            return currentTicket;
          });
        }
      }, 3000);
      
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    } else {
      setLoading(false);
    }
  }, [ticketId]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-body text-text-secondary">Verificando pagamento...</p>
        </div>
      </main>
    );
  }

  const isApproved = ticket?.status === 'approved';

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {isApproved ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-yellow-500" />
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              </div>
            )}
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">
            {isApproved ? 'Pagamento Aprovado!' : 'Aguardando Pagamento'}
          </h1>
          <p className="font-body text-text-secondary mt-2">
            {isApproved 
              ? 'Seu ingresso está confirmado!'
              : 'Efetue o pagamento para confirmar seu ingresso'}
          </p>
          
          {!isApproved && checkingPayment && (
            <p className="font-body text-sm text-primary mt-2">
              Verificando pagamento...
            </p>
          )}
        </div>

        {ticket && (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            {/* Event Info */}
            <div className="bg-primary text-white p-6">
              <h2 className="font-heading font-bold text-xl">{ticket.event.title}</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-body text-sm">
                    {formatDate(ticket.event.date)} às {formatTime(ticket.event.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-body text-sm">{ticket.event.location}</span>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-primary" />
                <span className="font-heading font-semibold text-text-primary">Detalhes do Ingresso</span>
              </div>

              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="font-body text-text-secondary">Quantidade</span>
                  <span className="font-body font-semibold text-text-primary">{ticket.quantity}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-text-secondary">Forma de pagamento</span>
                  <span className="font-body font-semibold text-text-primary capitalize">
                    {ticket.paymentMethod === 'pix_parcelado' ? 'PIX Parcelado' : ticket.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-text-secondary">Total pago</span>
                  <span className="font-body font-bold text-primary">{formatPrice(ticket.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-text-secondary">Status</span>
                  <span className={`font-body font-semibold ${
                    isApproved ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {isApproved ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-secondary" />
                  <span className="font-body text-sm text-text-secondary">{ticket.buyerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-text-secondary" />
                  <span className="font-body text-sm text-text-secondary">{ticket.buyerEmail}</span>
                </div>
                {ticket.buyerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-secondary" />
                    <span className="font-body text-sm text-text-secondary">{ticket.buyerPhone}</span>
                  </div>
                )}
              </div>

              {/* Ticket Code - Only show when approved */}
              {isApproved && ticket.ticketCode && (
                <div className="bg-secondary/30 rounded-card p-4 text-center">
                  <p className="font-body text-xs text-text-secondary mb-3">
                    Código do ingresso para validação
                  </p>
                  <div className="bg-white p-3 rounded-card inline-block">
                    <Barcode className="w-32 h-12 mx-auto text-primary" />
                  </div>
                  <p className="font-mono text-2xl font-bold text-primary mt-2 tracking-widest">
                    {ticket.ticketCode}
                  </p>
                  <p className="font-body text-xs text-text-secondary mt-2">
                    Apresente este código na entrada do evento
                  </p>
                </div>
              )}

              {/* Payment Link - Show when not approved yet */}
              {!isApproved && (
                <div className="mt-4 space-y-3">
                  <a
                    href={`https://www.mercadopago.com.br/pagamentos/${ticket.mercadoPagoId || ticket.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-primary text-white py-3 px-6 rounded-button font-body font-semibold text-center hover:bg-primary/90 transition-colors"
                  >
                    Pagar Agora
                  </a>
                  <p className="font-body text-xs text-text-secondary text-center">
                    Após pagar, esta página será atualizada automaticamente
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-primary text-white px-8 py-3 rounded-button font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            Voltar para Início
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-body text-text-secondary">Carregando...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
