'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit, Trash2, LogOut, Calendar, MapPin, DollarSign,
  Settings, Palette, Globe, QrCode, FileCheck, User,
  CheckCircle, Clock, XCircle, Eye, Tag, X,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface TierForm {
  id?: string;
  name: string;
  price: string;
  startDate: string;
  endDate: string;
  minQuantity: string;
}

interface AdminEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  price: number;
  imageUrl: string;
  tiers?: any[];
}

interface ReceiptTicket {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  receiptUrl: string | null;
  receipt2Url: string | null;
  createdAt: string;
  event: { id: string; title: string; date: string; location: string };
}

const emptyTier = (): TierForm => ({ name: '', price: '', startDate: '', endDate: '', minQuantity: '1' });

export default function AdminDashboard() {
  const router = useRouter();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'receipts' | 'settings'>('events');
  const [receipts, setReceipts] = useState<ReceiptTicket[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', price: '', imageUrl: '' });
  const [tiers, setTiers] = useState<TierForm[]>([]);
  const [settingsForm, setSettingsForm] = useState({
    siteName: '', logoUrl: '', primaryColor: '', secondaryColor: '',
    backgroundColor: '', textColor: '', footerText: '', contactEmail: '',
    heroTitle: '', heroSubtitle: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    if (settings && !settingsLoading) {
      setSettingsForm({
        siteName: settings.siteName || '',
        logoUrl: settings.logoUrl || '',
        primaryColor: settings.primaryColor || '#004642',
        secondaryColor: settings.secondaryColor || '#E5D4C8',
        backgroundColor: settings.backgroundColor || '#FFFFFF',
        textColor: settings.textColor || '#1A1A1A',
        footerText: settings.footerText || '',
        contactEmail: settings.contactEmail || '',
        heroTitle: settings.heroTitle || '',
        heroSubtitle: settings.heroSubtitle || '',
      });
    }
  }, [settings, settingsLoading]);

  useEffect(() => { if (activeTab === 'receipts') fetchReceipts(); }, [activeTab]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchReceipts = async () => {
    setReceiptsLoading(true);
    try {
      const res = await fetch('/api/admin/receipts');
      const data = await res.json();
      if (data.success) setReceipts(data.tickets);
    } catch (e) { console.error(e); } finally { setReceiptsLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem('adminToken'); router.push('/admin'); };

  const handleOpenModal = (ev?: AdminEvent) => {
    if (ev) {
      setEditingEvent(ev);
      setFormData({
        title: ev.title, description: ev.description,
        date: new Date(ev.date).toISOString().slice(0, 16),
        location: ev.location, price: String(ev.price / 100), imageUrl: ev.imageUrl,
      });
      setTiers((ev.tiers || []).map((t: any) => ({
        id: t.id, name: t.name, price: String(t.price / 100),
        startDate: new Date(t.startDate).toISOString().slice(0, 16),
        endDate: new Date(t.endDate).toISOString().slice(0, 16),
        minQuantity: String(t.minQuantity ?? 1),
      })));
    } else {
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', location: '', price: '', imageUrl: '' });
      setTiers([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingEvent(null); setTiers([]); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });

  const addTier = () => setTiers([...tiers, emptyTier()]);
  const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i: number, field: keyof TierForm, value: string) => {
    const u = [...tiers]; u[i] = { ...u[i], [field]: value }; setTiers(u);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Math.round(parseFloat(formData.price) * 100) || 0,
      tiers: tiers.filter(t => t.name && t.price && t.startDate && t.endDate)
        .map(t => ({
          name: t.name,
          price: t.price,
          startDate: t.startDate,
          endDate: t.endDate,
          minQuantity: t.minQuantity || '1',
        })),
    };
    const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events';
    try {
      const res = await fetch(url, { method: editingEvent ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { handleCloseModal(); fetchEvents(); } else alert(data.message || 'Erro ao salvar evento.');
    } catch { alert('Erro ao salvar evento.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchEvents(); else alert(data.message || 'Erro ao excluir evento.');
    } catch { alert('Erro ao excluir evento.'); } finally { setIsDeleting(null); }
  };


const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try { 
      await updateSettings(settingsForm); 
      alert('Configurações salvas com sucesso!'); 
    } catch { 
      alert('Erro ao salvar configurações.'); 
    } finally { 
      setIsSavingSettings(false); 
    }
  };

  const handleApproveReceipt = async (ticketId: string) => {
    if (!confirm('Aprovar este pagamento?')) return;
    try {
      const res = await fetch(`/api/admin/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: 'approve' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pagamento aprovado com sucesso!');
        fetchReceipts();
      } else {
        alert(data.message || 'Erro ao aprovar pagamento.');
      }
    } catch { alert('Erro ao aprovar pagamento.'); }
  };

  const handleRejectReceipt = async (ticketId: string) => {
    if (!confirm('Rejeitar este pagamento?')) return;
    try {
      const res = await fetch(`/api/admin/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: 'reject' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pagamento rejeitado.');
        fetchReceipts();
      } else {
        alert(data.message || 'Erro ao rejeitar pagamento.');
      }
    } catch { alert('Erro ao rejeitar pagamento.'); }
  };

  const fmtPrice = (c: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c / 100);
  const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const payLabel = (m: string) => m === 'pix_parcelado' ? 'PIX Parcelado' : 'PIX';

  const statusBadge = (s: string) => {
    const map: Record<string, JSX.Element> = {
      approved: <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3 h-3" />Aprovado</span>,
      pending: <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium"><Clock className="w-3 h-3" />Pendente</span>,
      partial: <span className="flex items-center gap-1 text-orange-600 text-xs font-medium"><Clock className="w-3 h-3" />Parcial</span>,
      cancelled: <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><XCircle className="w-3 h-3" />Cancelado</span>,
    };
    return map[s] ?? <span className="text-gray-500 text-xs">{s}</span>;
  };

  if (isLoading) return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-text-secondary">Carregando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-white shadow-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="font-heading font-bold text-xl text-primary">Admin - No Abraco do Pai</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-text-secondary hover:text-red-500 transition-colors font-body text-sm">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto">
            {([
              { key: 'events' as const, label: 'Eventos', icon: <Calendar className="w-4 h-4" /> },
              { key: 'receipts' as const, label: 'Comprovantes', icon: <FileCheck className="w-4 h-4" /> },
              { key: 'settings' as const, label: 'Configuracoes', icon: <Settings className="w-4 h-4" /> },
            ]).map(({ key, label, icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`py-4 px-1 border-b-2 font-body font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                {icon}{label}
              </button>
            ))}
            <button onClick={() => router.push('/admin/validar')}
              className="py-4 px-1 border-b-2 border-transparent font-body font-medium text-sm text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap flex items-center gap-2">
              <QrCode className="w-4 h-4" />Validar Ingressos
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'events' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-semibold text-2xl text-text-primary">Gerenciar Eventos</h2>
              <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-button font-body font-medium hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" />Novo Evento
              </button>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-card shadow-card">
                <p className="font-body text-text-secondary text-lg mb-4">Nenhum evento encontrado.</p>
                <button onClick={() => handleOpenModal()} className="text-primary hover:underline font-body">Criar primeiro evento</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-card shadow-card p-6 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-32 flex-shrink-0">
                      <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">{ev.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-text-secondary font-body mb-3">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{fmtDate(ev.date)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{ev.location}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{ev.price === 0 ? 'Gratis' : `R$ ${(ev.price / 100).toFixed(2).replace('.', ',')}`}</span>
                      </div>
                      <p className="font-body text-sm text-text-secondary line-clamp-2">{ev.description}</p>
                      {ev.tiers && ev.tiers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ev.tiers.map((t: any) => (
                            <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              <Tag className="w-3 h-3" />{t.name} - R$ {(t.price / 100).toFixed(2).replace('.', ',')}
                              {t.minQuantity > 1 && <span className="text-primary/70"> min.{t.minQuantity}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleOpenModal(ev)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(ev.id)} disabled={isDeleting === ev.id} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'receipts' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-semibold text-2xl text-text-primary">Comprovantes de Pagamento</h2>
              <button onClick={fetchReceipts} className="border border-primary text-primary px-4 py-2 rounded-button font-body text-sm font-medium hover:bg-primary/5 transition-colors">Atualizar</button>
            </div>
            {receiptsLoading ? (
              <div className="text-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="font-body text-text-secondary">Carregando comprovantes...</p></div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-card shadow-card"><FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="font-body text-text-secondary text-lg">Nenhum comprovante enviado ainda.</p></div>
            ) : (
              <div className="grid gap-4">
                {receipts.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-card shadow-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-text-secondary" /><span className="font-heading font-semibold text-text-primary">{ticket.buyerName}</span>{statusBadge(ticket.status)}</div>
                        <p className="font-body text-sm text-text-secondary">{ticket.buyerEmail}</p>
                        {ticket.buyerPhone && <p className="font-body text-sm text-text-secondary">{ticket.buyerPhone}</p>}
                      </div>
                      <div className="text-right"><p className="font-heading font-bold text-primary text-lg">{fmtPrice(ticket.totalPrice)}</p><p className="font-body text-xs text-text-secondary">{payLabel(ticket.paymentMethod)}</p></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="font-heading font-semibold text-text-primary text-sm">{ticket.event.title}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-text-secondary">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(ticket.event.date)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ticket.event.location}</span>
                        <span>{ticket.quantity}x ingresso</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="font-body text-sm font-medium text-text-primary">Comprovantes enviados:</p>
                      <div className="flex flex-wrap gap-4">
                        {ticket.receiptUrl && (
                          <div className="flex flex-col items-center gap-2">
                            <p className="font-body text-xs text-text-secondary">{ticket.paymentMethod === 'pix_parcelado' ? 'Comprovante 1' : 'Comprovante'}</p>
                            {ticket.receiptUrl.startsWith('data:image') ? (
                              <img src={ticket.receiptUrl} alt="Comprovante 1" className="w-36 h-36 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(ticket.receiptUrl)} />
                            ) : (
                              <a href={ticket.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"><Eye className="w-4 h-4" />Ver PDF</a>
                            )}
                          </div>
                        )}
                        {ticket.receipt2Url && (
                          <div className="flex flex-col items-center gap-2">
                            <p className="font-body text-xs text-text-secondary">Comprovante 2</p>
                            {ticket.receipt2Url.startsWith('data:image') ? (
                              <img src={ticket.receipt2Url} alt="Comprovante 2" className="w-36 h-36 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(ticket.receipt2Url)} />
                            ) : (
                              <a href={ticket.receipt2Url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"><Eye className="w-4 h-4" />Ver PDF 2</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons for pending/partial tickets */}
                    {ticket.status !== 'approved' && ticket.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleApproveReceipt(ticket.id)}
                          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-body text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar Ingresso
                        </button>
                        <button
                          onClick={() => handleRejectReceipt(ticket.id)}
                          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-body text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                    
                    <p className="font-body text-xs text-text-secondary mt-4">Compra realizada em {fmtDate(ticket.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <h2 className="font-heading font-semibold text-2xl text-text-primary mb-8">Configuracoes do Site</h2>
            <div className="bg-white rounded-card shadow-card p-6 space-y-6">
              <div>
                <h3 className="font-heading font-semibold text-lg text-text-primary mb-4 flex items-center gap-2"><Globe className="w-5 h-5" />Informacoes do Site</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Nome do Site', name: 'siteName', type: 'text' },
                    { label: 'URL do Logo', name: 'logoUrl', type: 'url', placeholder: 'https://...' },
                    { label: 'Email de Contato', name: 'contactEmail', type: 'email', placeholder: 'contato@exemplo.com.br' },
                    { label: 'Texto do Rodape', name: 'footerText', type: 'text' },
                  ].map(({ label, name, type, placeholder }) => (
                    <div key={name}>
                      <label className="block font-body text-sm text-text-primary mb-1">{label}</label>
                      <input type={type} name={name} value={(settingsForm as any)[name]} onChange={handleSettingsChange} placeholder={placeholder}
                        className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Secao Principal (Hero)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-body text-sm text-text-primary mb-1">Titulo Principal</label>
                    <input type="text" name="heroTitle" value={settingsForm.heroTitle} onChange={handleSettingsChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block font-body text-sm text-text-primary mb-1">Subtitulo</label>
                    <textarea name="heroSubtitle" value={settingsForm.heroSubtitle} onChange={handleSettingsChange} rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-text-primary mb-4 flex items-center gap-2"><Palette className="w-5 h-5" />Cores do Site</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Cor Primaria', name: 'primaryColor' },
                    { label: 'Cor Secundaria', name: 'secondaryColor' },
                    { label: 'Cor de Fundo', name: 'backgroundColor' },
                    { label: 'Cor do Texto', name: 'textColor' },
                  ].map(({ label, name }) => (
                    <div key={name}>
                      <label className="block font-body text-sm text-text-primary mb-1">{label}</label>
                      <div className="flex gap-2">
                        <input type="color" name={name} value={(settingsForm as any)[name]} onChange={handleSettingsChange} className="w-12 h-10 cursor-pointer border border-gray-300 rounded" />
                        <input type="text" name={name} value={(settingsForm as any)[name]} onChange={handleSettingsChange} className="flex-1 px-2 py-1 border border-gray-300 rounded font-body text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <button onClick={handleSaveSettings} disabled={isSavingSettings}
                  className="bg-primary text-white px-6 py-2 rounded-button font-body font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isSavingSettings ? 'Salvando...' : 'Salvar Configuracoes'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="font-heading font-semibold text-xl text-text-primary mb-6">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-body text-sm text-text-primary mb-1">Titulo</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block font-body text-sm text-text-primary mb-1">Descricao</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm text-text-primary mb-1">Data e Hora</label>
                    <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required
                      className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block font-body text-sm text-text-primary mb-1">Preco base (R$)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" placeholder="0 para gratis"
                      className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-sm text-text-primary mb-1">Local</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="Auditorio Central - Sao Paulo, SP"
                    className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block font-body text-sm text-text-primary mb-1">URL da Imagem</label>
                  <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-button font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />Lotes / Combos
                    </h4>
                    <button type="button" onClick={addTier}
                      className="flex items-center gap-1 text-sm text-primary border border-primary px-3 py-1 rounded-button hover:bg-primary/5 transition-colors">
                      <Plus className="w-3 h-3" />Adicionar Lote
                    </button>
                  </div>
                  {tiers.length === 0 && (
                    <p className="font-body text-sm text-text-secondary italic">Nenhum lote adicionado. O preco base sera usado.</p>
                  )}
                  <div className="space-y-3">
                    {tiers.map((tier, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-body text-sm font-medium text-text-primary">Lote {i + 1}</span>
                          <button type="button" onClick={() => removeTier(i)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-body text-xs text-text-secondary mb-1">Nome do lote</label>
                            <input type="text" value={tier.name} onChange={(e) => updateTier(i, 'name', e.target.value)}
                              placeholder="Ex: 1 Lote, Combo Casal..."
                              className="w-full px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block font-body text-xs text-text-secondary mb-1">Preco (R$)</label>
                            <input type="number" value={tier.price} onChange={(e) => updateTier(i, 'price', e.target.value)}
                              placeholder="0.00" min="0" step="0.01"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block font-body text-xs text-text-secondary mb-1">Inicio das vendas</label>
                            <input type="datetime-local" value={tier.startDate} onChange={(e) => updateTier(i, 'startDate', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block font-body text-xs text-text-secondary mb-1">Fim das vendas</label>
                            <input type="datetime-local" value={tier.endDate} onChange={(e) => updateTier(i, 'endDate', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block font-body text-xs text-text-secondary mb-1">
                              Minimo de ingressos para este lote
                            </label>
                            <div className="flex items-center gap-2">
                              <input type="number" value={tier.minQuantity} onChange={(e) => updateTier(i, 'minQuantity', e.target.value)}
                                placeholder="1" min="1" max="100"
                                className="w-24 px-3 py-1.5 border border-gray-300 rounded font-body text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                              <span className="font-body text-xs text-text-secondary">
                                {parseInt(tier.minQuantity) > 1
                                  ? `Aplicavel a partir de ${tier.minQuantity} ingressos`
                                  : 'Sem minimo (qualquer quantidade)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-text-primary rounded-button font-body font-medium hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-button font-body font-medium hover:bg-primary/90 transition-colors">
                    {editingEvent ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewImage} alt="Comprovante" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-gray-100">X</button>
          </div>
        </div>
      )}
    </main>
  );
}
