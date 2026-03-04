import { prisma } from '@/lib/prisma';
import CookieBanner from '@/components/CookieBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';

export const dynamic = 'force-dynamic';

async function getEvents() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'asc',
      },
    });
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function Home() {
  const events = await getEvents();

  return (
    <main className="min-h-screen bg-background">
      <CookieBanner />
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-text-primary mb-4 animate-fadeIn">
            Criado para promover suas experiências
          </h1>
          <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto animate-fadeIn delay-100">
            Descubra os melhores eventos religiosos e culturais perto de você
          </p>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-semibold text-2xl md:text-3xl text-text-primary mb-8">
            Próximos Eventos
          </h2>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-body text-text-secondary text-lg">
                Nenhum evento disponível no momento.
              </p>
              <p className="font-body text-text-secondary text-sm mt-2">
                Volte em breve para novos eventos!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event, index) => (
                <div 
                  key={event.id} 
                  className="animate-fadeIn"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <EventCard
                    id={event.id}
                    title={event.title}
                    date={event.date}
                    location={event.location}
                    price={event.price}
                    imageUrl={event.imageUrl}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
