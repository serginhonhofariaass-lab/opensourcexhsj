import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ingresso não encontrado' },
        { status: 404 }
      );
    }

    // Return ticket with ticketCode
    return NextResponse.json({
      ...ticket,
      ticketCode: ticket.ticketCode,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ingresso' },
      { status: 500 }
    );
  }
}
