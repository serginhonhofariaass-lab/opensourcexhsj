'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';

interface EventCardProps {
  id: string;
  title: string;
  date: Date;
  location: string;
  price: number;
  imageUrl: string;
}

export default function EventCard({ id, title, date, location, price, imageUrl }: EventCardProps) {
  const { settings } = useSettings();
  
  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedPrice = price === 0 ? 'Grátis' : `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;

  return (
    <Link href={`/evento/${id}`} className="group block">
      <div className="bg-white rounded-large overflow-hidden shadow-card transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-sm font-body mb-1" style={{ color: settings?.textColor || '#6B7280' }}>
            {formattedDate}
          </p>
          <h3 className="font-heading font-semibold text-lg mb-1 line-clamp-2" style={{ color: settings?.textColor || '#1A1A1A' }}>
            {title}
          </h3>
          <p className="text-sm font-body mb-3 line-clamp-1" style={{ color: settings?.textColor || '#6B7280' }}>
            {location}
          </p>
          <span 
            className="inline-block px-3 py-1 font-body font-medium text-sm rounded-button"
            style={{ 
              backgroundColor: settings?.secondaryColor || '#E5D4C8',
              color: settings?.primaryColor || '#004642'
            }}
          >
            {formattedPrice}
          </span>
        </div>
      </div>
    </Link>
  );
}
