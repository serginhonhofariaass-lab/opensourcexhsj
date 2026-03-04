'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  MapPin, 
  Ticket,
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface ValidationResult {
  success: boolean;
  message: string;
  valid?: boolean;
  usedAt?: string;
  usedBy?: string;
  ticket?: {
    id: string;
    buyerName: string;
    buyerEmail?: string;
    buyerPhone?: string;
    eventTitle: string;
    eventDate: string;
    eventLocation?: string;
    quantity: number;
    status?: string;
  };
}

export default function ValidateTicketPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    // Get admin email from localStorage
    const storedEmail = localStorage.getItem('adminEmail');
    if (storedEmail) {
      setAdminEmail(storedEmail);
    }
  }, []);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/validate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          adminEmail,
        }),
      });

      const data = await response.json();
      
      // If ticket is pending, try to check payment status
      if (!data.valid && data.ticket?.status === 'pending') {
        setCheckingPayment(true);
        
        try {
          const paymentResponse = await fetch('/api/admin/check-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketCode: qrCode.trim(),
            }),
          });
          
          const paymentData = await paymentResponse.json();
          
          if (paymentData.success) {
            // Try validation again after payment check
            const retryResponse = await fetch('/api/admin/validate-ticket', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                qrCode: qrCode.trim(),
                adminEmail,
              }),
            });
            
            const retryData = await retryResponse.json();
            setResult(retryData);
          } else {
            setResult(data);
          }
        } catch (paymentError) {
          console.error('Payment check error:', paymentError);
          setResult(data);
        } finally {
          setCheckingPayment(false);
        }
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao validar ingresso. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!qrCode.trim()) return;
    
    setCheckingPayment(true);
    
    try {
      const response = await fetch('/api/admin/check-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketCode: qrCode.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          valid: true,
          ticket: data.ticket,
        });
      } else {
        setResult({
          success: false,
          message: data.message,
        });
      }
    } catch (error) {
      console.error('Check payment error:', error);
      setResult({
        success: false,
        message: 'Erro ao verificar pagamento.',
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleNewScan = () => {
    setQrCode('');
    setResult(null);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-white shadow-header sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
            <h1 className="font-heading font-bold text-xl text-text-primary">
              Validar Ingresso
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Scan Mode Info */}
        <div className="bg-primary/10 rounded-card p-4 mb-6">
          <div className="flex items-start gap-3">
            <QrCode className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h2 className="font-heading font-semibold text-text-primary">
                Como validar:
              </h2>
              <ul className="font-body text-sm text-text-secondary mt-2 space-y-1">
                <li>• Peça ao cliente para mostrar o código do ingresso</li>
                <li>• Digite o código no campo abaixo</li>
                <li>• O sistema verificará automaticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleValidate} className="bg-white rounded-card shadow-card p-6">
          <label className="block font-heading font-semibold text-text-primary mb-3">
            Código do Ingresso
          </label>
          <div className="space-y-4">
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Cole ou digite o código do ingresso"
              className="w-full px-4 py-3 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || !qrCode.trim()}
              className="w-full bg-primary text-white py-3 px-6 rounded-button font-body font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Validar Ingresso
                </>
              )}
            </button>

            {/* Separate button to check payment status */}
            <button
              type="button"
              onClick={handleCheckPayment}
              disabled={checkingPayment || !qrCode.trim()}
              className="w-full bg-secondary text-text-primary py-3 px-6 rounded-button font-body font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando pagamento...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Verificar Pagamento
                </>
              )}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div className={`mt-6 rounded-card shadow-card overflow-hidden ${
            result.valid ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.valid ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  result.usedAt ? (
                    <XCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )
                )}
                <h3 className={`font-heading font-bold text-xl ${
                  result.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </h3>
              </div>

              {result.ticket && (
                <div className="bg-white rounded-card p-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-text-secondary" />
                      <span className="font-body text-text-primary">
                        {result.ticket.buyerName}
                      </span>
                    </div>
                    {result.ticket.buyerEmail && (
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm text-text-secondary">
                          {result.ticket.buyerEmail}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-primary" />
                      <span className="font-body text-primary font-semibold">
                        {result.ticket.quantity}x Ingresso
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <span className="font-body text-text-secondary">
                        {formatDate(result.ticket.eventDate)}
                      </span>
                    </div>
                    {result.ticket.eventLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-text-secondary" />
                        <span className="font-body text-text-secondary">
                          {result.ticket.eventLocation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.usedAt && (
                <div className="mt-4 p-3 bg-red-100 rounded-card">
                  <p className="font-body text-sm text-red-700">
                    <strong>Utilizado em:</strong> {formatDate(result.usedAt)}
                    {result.usedBy && ` por ${result.usedBy}`}
                  </p>
                </div>
              )}

              <button
                onClick={handleNewScan}
                className="w-full mt-4 bg-primary text-white py-3 px-6 rounded-button font-body font-semibold hover:bg-primary/90 transition-colors"
              >
                Validar Outro Ingresso
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
