import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const body = await request.json();
    const { receiptData, receiptNumber } = body;

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Dados do comprovante são obrigatórios' },
        { status: 400 }
      );
    }

    if (receiptNumber !== 1 && receiptNumber !== 2) {
      return NextResponse.json(
        { error: 'Número do comprovante inválido (deve ser 1 ou 2)' },
        { status: 400 }
      );
    }

    // Check ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ingresso não encontrado' },
        { status: 404 }
      );
    }

    // Update the appropriate receipt field
    const updateData =
      receiptNumber === 1
        ? { receiptUrl: receiptData }
        : { receipt2Url: receiptData };

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: { event: true },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar comprovante' },
      { status: 500 }
    );
  }
}
