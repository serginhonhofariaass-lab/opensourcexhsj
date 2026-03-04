import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import PurchaseForm from './PurchaseForm';

interface Props {
  params: { id: string };
}

async function getEvent(id: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { tiers: { orderBy: { startDate: 'asc' } } },
    });
    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export default async function EventPage({ params }: Props) {
  const event = await getEvent(params.id);

  if (!event) {
    notFound();
  }

  const formattedDate = new Date(event.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine active tier based on current date
  const now = new Date();
  const activeTier = event.tiers.find(
    (t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now
  ) || null;

  // Display price: active tier price or fallback event price
  const displayPrice = activeTier ? activeTier.price : event.price;
  const formattedPrice =
    displayPrice === 0
      ? 'Grátis'
      : `R$ ${(displayPrice / 100).toFixed(2).replace('.', ',')}`;

  return (
    <main className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 font-body transition-colors"
        >
          ← Voltar para eventos
        </Link>
      </div>

      {/* Event Hero Image */}
      <div className="relative w-full h-[300px] md:h-[400px]">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Event Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        <div className="bg-white rounded-card shadow-card p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Info */}
            <div className="lg:col-span-2">
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-4">
                {event.title}
              </h1>

              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-body">{formattedDate}</span>
                </div>

                <div className="flex items-center gap-2 text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-body">{event.location}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="font-heading font-semibold text-xl text-text-primary mb-3">
                  Sobre o Evento
                </h2>
                <p className="font-body text-text-secondary leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Tiers / Lotes section */}
              {event.tiers.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-heading font-semibold text-xl text-text-primary mb-3">
                    Lotes / Combos
                  </h2>
                  <div className="space-y-2">
                    {event.tiers.map((tier) => {
                      const tierNow = new Date();
                      const isActive =
                        new Date(tier.startDate) <= tierNow &&
                        new Date(tier.endDate) >= tierNow;
                      const isPast = new Date(tier.endDate) < tierNow;
                      const isFuture = new Date(tier.startDate) > tierNow;

                      return (
                        <div
                          key={tier.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isActive
                              ? 'border-primary bg-primary/5'
                              : isPast
                              ? 'border-gray-200 bg-gray-50 opacity-60'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div>
                            <span className="font-heading font-semibold text-text-primary">
                              {tier.name}
                            </span>
                            {isActive && (
                              <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                Ativo
                              </span>
                            )}
                            {isPast && (
                              <span className="ml-2 text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">
                                Encerrado
                              </span>
                            )}
                            {isFuture && (
                              <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                                Em breve
                              </span>
                            )}
                            <p className="font-body text-xs text-text-secondary mt-0.5">
                              {new Date(tier.startDate).toLocaleDateString('pt-BR')} –{' '}
                              {new Date(tier.endDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className="font-heading font-bold text-primary">
                            {tier.price === 0
                              ? 'Grátis'
                              : `R$ ${(tier.price / 100).toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Section */}
            <div className="lg:col-span-1">
              <div className="bg-background-secondary rounded-card p-6 sticky top-24">
                <div className="text-center mb-6">
                  <p className="font-body text-text-secondary text-sm mb-1">
                    {activeTier ? activeTier.name : 'Preço do ingresso'}
                  </p>
                  <p className="font-heading font-bold text-4xl text-primary">
                    {formattedPrice}
                  </p>
                </div>

                <PurchaseForm
                  eventId={event.id}
                  eventTitle={event.title}
                  price={displayPrice}
                  tiers={event.tiers.map((t) => ({
                    id: t.id,
                    name: t.name,
                    price: t.price,
                    startDate: t.startDate.toISOString(),
                    endDate: t.endDate.toISOString(),
                    minQuantity: t.minQuantity ?? 1,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
