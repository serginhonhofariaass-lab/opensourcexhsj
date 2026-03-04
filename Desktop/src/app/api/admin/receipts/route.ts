import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch tickets with receipts ready for admin review:
    // - PIX: receiptUrl submitted
    // - PIX Parcelado: BOTH receiptUrl AND receipt2Url submitted
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          {
            paymentMethod: 'pix',
            receiptUrl: { not: null },
          },
          {
            paymentMethod: 'pix_parcelado',
            receiptUrl: { not: null },
            receipt2Url: { not: null },
          },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar comprovantes' },
      { status: 500 }
    );
  }
}
