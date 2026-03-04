import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Props {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { tiers: { orderBy: { startDate: 'asc' } } },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Evento não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar evento.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { title, description, date, location, price, imageUrl, tiers } = body;

    if (!title || !description || !date || !location || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    // Delete existing tiers and recreate
    await prisma.ticketTier.deleteMany({ where: { eventId: params.id } });

    const event = await prisma.event.update({
      where: { id: params.id },
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
      message: 'Evento atualizado com sucesso!',
      event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar evento.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      message: 'Evento excluído com sucesso!',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao excluir evento.' },
      { status: 500 }
    );
  }
}
