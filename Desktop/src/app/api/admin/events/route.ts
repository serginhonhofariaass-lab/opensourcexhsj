import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: { tiers: { orderBy: { startDate: 'asc' } } },
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar eventos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, location, price, imageUrl, tiers } = body;

    if (!title || !description || !date || !location || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        price: price || 0,
        imageUrl,
        tiers: tiers && tiers.length > 0
          ? {
              create: tiers.map((t: any) => ({
                name: t.name,
                price: Math.round(parseFloat(t.price) * 100),
                startDate: new Date(t.startDate),
                endDate: new Date(t.endDate),
                minQuantity: parseInt(t.minQuantity) || 1,
              })),
            }
          : undefined,
      },
      include: { tiers: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Evento criado com sucesso!',
      event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao criar evento.' },
      { status: 500 }
    );
  }
}
