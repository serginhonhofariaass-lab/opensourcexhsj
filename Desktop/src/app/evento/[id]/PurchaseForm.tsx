'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Check, ChevronRight, Minus, Plus, Tag, Upload } from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  price: number;
  startDate: string;
  endDate: string;
  minQuantity?: number;
}

interface PurchaseFormProps {
  eventId: string;
  eventTitle: string;
  price: number;
  tiers?: Tier[];
  eventDate?: string;
  eventLocation?: string;
}

type Step = 'tier' | 'quantity' | 'info' | 'payment' | 'success';

interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

export default function PurchaseForm({
  eventId,
  eventTitle,
  price,
  tiers = [],
  eventDate,
  eventLocation,
}: PurchaseFormProps) {
  const router = useRouter();

  // Determine active tiers based on current date
  const now = new Date();
  const activeTiers = tiers.filter(
    (t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now
  );
  const hasTiers = tiers.length > 0;
  const hasActiveTiers = activeTiers.length > 0;

  // If there are tiers, start at 'tier' step; otherwise skip to 'quantity'
  const initialStep: Step = hasTiers ? 'tier' : 'quantity';

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(
    activeTiers.length === 1 ? activeTiers[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'pix_parcelado'>('pix');
  const [paymentData, setPaymentData] = useState<{
    url?: string | null;
    ticketId?: string;
    secondUrl?: string | null;
    secondPaymentId?: string;
    paymentMethod?: string;
    receiptUploaded?: boolean;
  }>({});
const [isUploading, setIsUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check localStorage on mount for pending tickets
  useEffect(() => {
    // Don't automatically go to success - let user complete the flow
    // This was causing issues where users went straight to success without selecting quantity/info
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setBuyerInfo(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // Effective price: selected tier price or fallback event price
  const effectivePrice = selectedTier ? selectedTier.price : price;
  const totalPrice = effectivePrice * quantity;
  const parcelaPrice = Math.ceil(totalPrice / 2);

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const minQty = selectedTier?.minQuantity && selectedTier.minQuantity > 1 ? selectedTier.minQuantity : 1;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= minQty && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleBuyerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuyerInfo({ ...buyerInfo, [e.target.name]: e.target.value });
    setError('');
  };

  const validateCpf = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    // Reject all-same-digit CPFs
    if (/^(\d)\1{10}$/.test(digits)) return false;
    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;
    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[10])) return false;
    return true;
  };

  const validateInfo = () => {
    if (!buyerInfo.name.trim()) {
      setError('Por favor, insira seu nome completo.');
      return false;
    }
    if (!buyerInfo.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email)) {
      setError('Por favor, insira um email válido.');
      return false;
    }
    if (!buyerInfo.phone.trim()) {
      setError('Por favor, insira seu telefone.');
      return false;
    }
    if (!buyerInfo.cpf.trim()) {
      setError('Por favor, insira seu CPF.');
      return false;
    }
    if (!validateCpf(buyerInfo.cpf)) {
      setError('CPF inválido. Por favor, verifique e tente novamente.');
      return false;
    }
    return true;
  };

  const handleInfoSubmit = () => {
    if (validateInfo()) setStep('payment');
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          eventTitle,
          buyerName: buyerInfo.name,
          buyerEmail: buyerInfo.email,
          buyerPhone: buyerInfo.phone,
          buyerCpf: buyerInfo.cpf,
          price: effectivePrice,
          quantity,
          totalPrice,
          paymentMethod,
          tierId: selectedTier?.id || null,
          tierName: selectedTier?.name || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('userEmail', buyerInfo.email);
        
        // IMPORTANT: Save the database ticket ID (not ticketCode) for receipt upload
        localStorage.setItem('pendingTicketId', data.ticketId);

        if (data.isFree) {
          router.push(`/sucesso?ticketId=${data.ticketId}`);
        } else if (data.paymentMethod === 'pix_parcelado' && data.secondUrl) {
          setPaymentData({
            url: data.url,
            ticketId: data.ticketId,
            secondUrl: data.secondUrl,
            secondPaymentId: data.secondPaymentId,
          });
          setStep('success');
        } else if (data.url) {
          window.open(data.url, '_blank');
          setStep('success');
          setPaymentData({ ticketId: data.ticketId, url: data.url });
        } else {
          setStep('success');
          setPaymentData({ ticketId: data.ticketId });
        }
      } else {
        setError(data.message || 'Erro ao processar compra. Tente novamente.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Erro ao processar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPayment = (url: string) => window.open(url, '_blank');


  // Handle receipt upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>, receiptNumber: number = 1) => {
    const file = e.target.files?.[0];
    if (!file || !paymentData.ticketId) return;

    setIsUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch(`/api/tickets/${paymentData.ticketId}/receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            receiptData: base64,
            receiptNumber: receiptNumber
          }),
        });

        if (response.ok) {
          // Mark receipt as uploaded and redirect to minhas-compras
          setPaymentData(prev => ({ ...prev, receiptUploaded: true }));
          router.push('/minhas-compras');
        } else {
          const data = await response.json();
          setError(data.error || 'Erro ao enviar comprovante. Tente novamente.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erro ao enviar comprovante. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // ─── STEP: TIER SELECTION ────────────────────────────────────────────────────
  if (step === 'tier') {
    return (
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-heading text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Escolha o lote
        </h3>

        {!hasActiveTiers && (
          <div className="text-center py-6">
            <p className="font-body text-text-secondary">
              Nenhum lote disponível no momento.
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {tiers.map((tier) => {
            const tierNow = new Date();
            const isActive =
              new Date(tier.startDate) <= tierNow && new Date(tier.endDate) >= tierNow;
            const isPast = new Date(tier.endDate) < tierNow;
            const isSelected = selectedTier?.id === tier.id;

            return (
              <button
                key={tier.id}
                disabled={!isActive}
                onClick={() => {
                  if (isActive) {
                    setSelectedTier(tier);
                    if (tier.minQuantity && tier.minQuantity > quantity) {
                      setQuantity(tier.minQuantity);
                    }
                  }
                }}
                className={`w-full text-left flex items-center justify-between p-4 border-2 rounded-card transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : isActive
                    ? 'border-gray-200 hover:border-primary/50 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-text-primary">
                      {tier.name}
                    </span>
                    {isActive && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                        Disponível
                      </span>
                    )}
                    {isPast && (
                      <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">
                        Encerrado
                      </span>
                    )}
                    {!isActive && !isPast && (
                      <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                        Em breve
                      </span>
                    )}
                    {tier.minQuantity && tier.minQuantity > 1 && (
                      <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded-full">
                        Mín. {tier.minQuantity} ingressos
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-secondary mt-0.5">
                    {new Date(tier.startDate).toLocaleDateString('pt-BR')} –{' '}
                    {new Date(tier.endDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-primary">
                    {formatPrice(tier.price)}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setStep('quantity')}
          disabled={!selectedTier}
          className="w-full bg-primary text-white py-3 px-6 rounded-button font-body font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuar <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ─── STEP: QUANTITY ──────────────────────────────────────────────────────────
  if (step === 'quantity') {
    return (
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-heading text-xl font-semibold text-text-primary mb-4">
          Quantos ingressos?
        </h3>

        {selectedTier && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-body text-sm text-primary font-semibold">
              {selectedTier.name} — {formatPrice(selectedTier.price)} cada
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
            disabled={quantity <= minQty}
          >
            <Minus className="w-5 h-5 text-primary" />
          </button>
          <span className="font-heading text-3xl font-bold text-primary w-16 text-center">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
            disabled={quantity >= 10}
          >
            <Plus className="w-5 h-5 text-primary" />
          </button>
        </div>

        {minQty > 1 && (
          <p className="font-body text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
            Este lote requer no mínimo {minQty} ingressos.
          </p>
        )}

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-body text-text-secondary">Valor por ingresso</span>
            <span className="font-body text-text-primary">{formatPrice(effectivePrice)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-heading font-semibold text-text-primary">Total</span>
            <span className="font-heading text-2xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {hasTiers && (
            <button
              onClick={() => setStep('tier')}
              className="flex-1 bg-gray-200 text-text-primary py-3 px-6 rounded-button font-body font-semibold hover:bg-gray-300 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => setStep('info')}
            className="flex-1 bg-primary text-white py-3 px-6 rounded-button font-body font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP: INFO ──────────────────────────────────────────────────────────────
  if (step === 'info') {
    return (
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-heading text-xl font-semibold text-text-primary mb-4">
          Seus dados
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block font-body text-sm text-text-primary mb-1">
              Nome completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={buyerInfo.name}
              onChange={handleBuyerInfoChange}
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="cpf" className="block font-body text-sm text-text-primary mb-1">
              CPF *
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={buyerInfo.cpf}
              onChange={handleBuyerInfoChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full px-4 py-3 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-body text-sm text-text-primary mb-1">
              E-mail *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={buyerInfo.email}
              onChange={handleBuyerInfoChange}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block font-body text-sm text-text-primary mb-1">
              Celular *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={buyerInfo.phone}
              onChange={handleBuyerInfoChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-button font-body text-sm mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setStep('quantity')}
            className="flex-1 bg-gray-200 text-text-primary py-3 px-6 rounded-button font-body font-semibold hover:bg-gray-300 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleInfoSubmit}
            className="flex-1 bg-primary text-white py-3 px-6 rounded-button font-body font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP: PAYMENT ───────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-heading text-xl font-semibold text-text-primary mb-4">
          Forma de pagamento
        </h3>

        {selectedTier && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-body text-sm text-primary font-semibold">
              {selectedTier.name} — {quantity}x {formatPrice(selectedTier.price)}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <label
            className={`flex items-center gap-4 p-4 border-2 rounded-card cursor-pointer transition-all ${
              paymentMethod === 'pix'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="pix"
              checked={paymentMethod === 'pix'}
              onChange={() => setPaymentMethod('pix')}
              className="hidden"
            />
            <Smartphone className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <span className="font-heading font-semibold text-text-primary">PIX</span>
              <p className="font-body text-sm text-text-secondary">Pagamento imediato</p>
            </div>
            {paymentMethod === 'pix' && <Check className="w-6 h-6 text-primary" />}
          </label>

          <label
            className={`flex items-center gap-4 p-4 border-2 rounded-card cursor-pointer transition-all ${
              paymentMethod === 'pix_parcelado'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="pix_parcelado"
              checked={paymentMethod === 'pix_parcelado'}
              onChange={() => setPaymentMethod('pix_parcelado')}
              className="hidden"
            />
            <Smartphone className="w-8 h-8 text-primary" />
            <div className="flex-1">
<span className="font-heading font-semibold text-text-primary">PIX Parcelado</span>
              <p className="font-body text-sm text-text-secondary">2x de PIX - pague em até 2 meses</p>
            </div>
            <div className="text-right">
              <span className="font-body text-xs text-text-secondary">2x de</span>
              <p className="font-heading font-bold text-primary">{formatPrice(parcelaPrice)}</p>
            </div>
            {paymentMethod === 'pix_parcelado' && <Check className="w-6 h-6 text-primary" />}
          </label>
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-heading font-semibold text-text-primary">Total a pagar</span>
            <span className="font-heading text-2xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
          {paymentMethod === 'pix_parcelado' && (
            <p className="font-body text-sm text-text-secondary mt-2">
              Você receberá 2 códigos PIX. O ingresso será liberado após o pagamento de ambos.
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-button font-body text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('info')}
            className="flex-1 bg-gray-200 text-text-primary py-3 px-6 rounded-button font-body font-semibold hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            Voltar
          </button>
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="flex-1 bg-primary text-white py-3 px-6 rounded-button font-body font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processando...' : 'Finalizar Compra'}
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP: SUCCESS ───────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-heading text-xl font-semibold text-text-primary">
          Pedido realizado com sucesso!
        </h3>
        <p className="font-body text-text-secondary mt-2">
          Agora é só realizar o pagamento para confirmar seu(s) ingresso(s)
        </p>
      </div>

      {/* Payment buttons - always show for non-free purchases */}
      {paymentData.ticketId && (
        <div className="space-y-4">
          <div className="bg-secondary/30 rounded-card p-4">
            <h4 className="font-heading font-semibold text-text-primary mb-2">
              {paymentData.secondUrl ? '1º Pagamento' : 'Pagamento PIX'}
            </h4>
            <p className="font-body text-sm text-text-secondary mb-3">
              Valor: {formatPrice(paymentData.secondUrl ? parcelaPrice : totalPrice)}
            </p>
            <button
              onClick={() => paymentData.url ? handleOpenPayment(paymentData.url) : null}
              className="w-full bg-primary text-white py-3 px-6 rounded-button font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              {paymentData.secondUrl ? 'Pagar 1º PIX' : 'Pagar PIX'}
            </button>
          </div>

          {paymentData.secondUrl && (
            <div className="bg-secondary/30 rounded-card p-4">
              <h4 className="font-heading font-semibold text-text-primary mb-2">2º Pagamento</h4>
              <p className="font-body text-sm text-text-secondary mb-3">
                Valor: {formatPrice(parcelaPrice)}
              </p>
              <button
                onClick={() => handleOpenPayment(paymentData.secondUrl!)}
                className="w-full bg-primary text-white py-3 px-6 rounded-button font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Pagar 2º PIX
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload receipt section - hide after upload */}
      {!paymentData.receiptUploaded && (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-heading font-semibold text-text-primary mb-2 text-center">
          Já Realizou o Pagamento?
        </h4>
        <p className="font-body text-sm text-text-secondary text-center mb-4">
          Anexe o comprovante para acelerar a liberação do seu ingresso
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleReceiptUpload}
          accept="image/*,.pdf"
          className="hidden"
        />
        
        <button
          onClick={triggerFileInput}
          disabled={isUploading || !paymentData.ticketId}
          className="w-full bg-amber-500 text-white py-3 px-6 rounded-button font-body font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Upload className="w-5 h-5" />
          {isUploading ? 'Enviando...' : 'Anexar Comprovante'}
        </button>
      </div>
      )}

      {paymentData.receiptUploaded && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="font-body text-green-700 font-semibold">
              Comprovante enviado com sucesso!
            </p>
            <p className="font-body text-sm text-green-600 mt-1">
              Você será redirecionado para Minhas Compras...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-button font-body text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}

