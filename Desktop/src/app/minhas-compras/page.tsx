'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, User, CheckCircle, Clock, XCircle, Upload, Paperclip } from 'lucide-react';

interface TicketData {
  id: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  receiptUrl: string | null;
  receipt2Url: string | null;
  createdAt: Date;
  event: {
    id: string;
    title: string;
    date: Date;
    location: string;
    imageUrl: string;
  };
}

export default function MinhasComprasPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchTickets = () => {
    if (!userEmail) return;
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    fetch(`/api/tickets?email=${encodeURIComponent(userEmail)}&_=${timestamp}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    const cookies = document.cookie.split(';');
    let email: string | null = null;

    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'userEmail') {
        email = decodeURIComponent(value);
        break;
      }
    }

    if (!email) {
      router.push('/login');
      return;
    }

    setUserEmail(email);
  }, [router]);

  useEffect(() => {
    if (userEmail) {
      // Initial fetch
      fetchTickets();
      
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        fetchTickets();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Confirmado
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
            <Clock className="w-4 h-4" /> Pendente
          </span>
        );
      case 'partial':
        return (
          <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
            <Clock className="w-4 h-4" /> Parcial
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
            <XCircle className="w-4 h-4" /> Cancelado
          </span>
        );
      default:
        return <span className="text-gray-500 text-sm">{status}</span>;
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    ticketId: string,
    receiptNumber: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Formato inválido. Use imagem (JPG, PNG, GIF, WEBP) ou PDF.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    const uploadKey = `${ticketId}-${receiptNumber}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      const res = await fetch(`/api/tickets/${ticketId}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptData: base64, receiptNumber }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setTickets((prev) =>
          prev.map((t) => {
            if (t.id === ticketId) {
              return {
                ...t,
                receiptUrl: receiptNumber === 1 ? base64 : t.receiptUrl,
                receipt2Url: receiptNumber === 2 ? base64 : t.receipt2Url,
              };
            }
            return t;
          })
        );
      } else {
        alert('Erro ao enviar comprovante. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar comprovante. Tente novamente.');
    } finally {
      setUploading((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleLogout = () => {
    document.cookie = 'userEmail=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    router.push('/');
  };

  // Check if all required receipts are submitted for a ticket
  const allReceiptsSubmitted = (ticket: TicketData): boolean => {
    if (ticket.paymentMethod === 'pix_parcelado') {
      return !!ticket.receiptUrl && !!ticket.receipt2Url;
    }
    return !!ticket.receiptUrl;
  };

  // Check if ticket is approved (show ticket only when approved)
  const isTicketApproved = (status: string): boolean => {
    return status === 'approved';
  };

  const renderReceiptSection = (ticket: TicketData) => {
    // Only show for PIX payment methods
    if (ticket.paymentMethod !== 'pix' && ticket.paymentMethod !== 'pix_parcelado') {
      return null;
    }

    // If ticket is approved, show success
    if (isTicketApproved(ticket.status)) {
      return (
        <div className="mt-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-green-700 text-base">
              Ingresso Confirmado! 🎉
            </p>
            <p className="font-body text-green-600 text-sm">
              Seu ingresso foi aprovado e está disponível.
            </p>
          </div>
        </div>
      );
    }

    // If receipts submitted but not yet approved — show pending message
    if (allReceiptsSubmitted(ticket)) {
      return (
        <div className="mt-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <Clock className="w-10 h-10 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-yellow-700 text-base">
              Não se preocupe
            </p>
            <p className="font-body text-yellow-600 text-sm">
              Seu pedido está sendo analisado e você receberá seu ingresso nas próximas 24 horas.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-3">
        <p className="font-body text-sm text-text-secondary">
          📎 Anexe o comprovante de pagamento para confirmar seu ingresso:
        </p>

        {/* PIX — single receipt */}
        {ticket.paymentMethod === 'pix' && (
          <div>
            {ticket.receiptUrl ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Comprovante enviado com sucesso!
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[`${ticket.id}-1`] = el; }}
                  onChange={(e) => handleFileChange(e, ticket.id, 1)}
                />
                <button
                  onClick={() => fileInputRefs.current[`${ticket.id}-1`]?.click()}
                  disabled={uploading[`${ticket.id}-1`]}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-button font-body text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {uploading[`${ticket.id}-1`] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Paperclip className="w-4 h-4" />
                      Anexar Comprovante
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* PIX Parcelado — two receipts */}
        {ticket.paymentMethod === 'pix_parcelado' && (
          <div className="space-y-2">
            {/* Receipt 1 */}
            <div className="flex items-center gap-3">
              {ticket.receiptUrl ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Comprovante 1 enviado!
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[`${ticket.id}-1`] = el; }}
                    onChange={(e) => handleFileChange(e, ticket.id, 1)}
                  />
                  <button
                    onClick={() => fileInputRefs.current[`${ticket.id}-1`]?.click()}
                    disabled={uploading[`${ticket.id}-1`]}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-button font-body text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {uploading[`${ticket.id}-1`] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4" />
                        Anexar Comprovante 1
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Receipt 2 */}
            <div className="flex items-center gap-3">
              {ticket.receipt2Url ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Comprovante 2 enviado!
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[`${ticket.id}-2`] = el; }}
                    onChange={(e) => handleFileChange(e, ticket.id, 2)}
                  />
                  <button
                    onClick={() => fileInputRefs.current[`${ticket.id}-2`]?.click()}
                    disabled={uploading[`${ticket.id}-2`]}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-button font-body text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {uploading[`${ticket.id}-2`] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4" />
                        Anexar Comprovante 2
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-body text-text-secondary">Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-header sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading font-bold text-xl text-primary">
            No Abraço do Pai
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-body text-sm text-text-secondary hidden sm:block">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="font-body text-sm text-red-500 hover:text-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl text-text-primary">
            Minhas Compras
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 rounded-button font-body text-sm transition-colors disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-body text-text-secondary mb-4">
              Você ainda não comprou nenhum ingresso.
            </p>
            <Link
              href="/"
              className="inline-block bg-primary text-white px-6 py-2 rounded-button font-body font-semibold hover:bg-primary/90"
            >
              Ver Eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-card shadow-card overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Event Image */}
                  <div className="md:w-48 h-32 md:h-auto relative flex-shrink-0">
                    <img
                      src={ticket.event.imageUrl}
                      alt={ticket.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-heading font-semibold text-text-primary">
                        {ticket.event.title}
                      </h3>
                      {getStatusBadge(ticket.status)}
                    </div>

                    <div className="space-y-1 text-sm text-text-secondary mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(ticket.event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{ticket.event.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-text-secondary" />
                        <span className="font-body text-sm">{ticket.quantity}x ingresso</span>
                      </div>
                      <div className="font-heading font-bold text-primary">
                        {formatPrice(ticket.totalPrice)}
                      </div>
                      <div className="font-body text-xs text-text-secondary capitalize">
                        {ticket.paymentMethod === 'pix_parcelado' ? 'PIX Parcelado' : 'PIX'}
                      </div>
                    </div>

                    {/* Only show "Ver Ingresso" button when ticket is approved */}
                    {isTicketApproved(ticket.status) && (
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/sucesso?ticketId=${ticket.id}`}
                          className="inline-block bg-primary text-white px-4 py-2 rounded-button font-body text-sm font-semibold hover:bg-primary/90"
                        >
                          Ver Ingresso
                        </Link>
                      </div>
                    )}

                    {/* Receipt Upload Section */}
                    {renderReceiptSection(ticket)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
