import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail não fornecido' },
        { status: 400 }
      );
    }

    // Check if there's at least one ticket with this email
    const ticket = await prisma.ticket.findFirst({
      where: { buyerEmail: email },
    });

    if (ticket) {
      return NextResponse.json({ success: true, exists: true });
    }

    return NextResponse.json(
      { error: 'E-mail não encontrado' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
