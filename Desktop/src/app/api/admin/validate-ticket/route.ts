import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept both ticketCode and qrCode for compatibility
    const ticketCode = body.ticketCode || body.qrCode;
    const eventId = body.eventId;
    const adminEmail = body.adminEmail;

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, message: 'Código do ingresso não fornecido.' },
        { status: 400 }
      );
    }

    // Find ticket by ticket code
    const ticket = await prisma.ticket.findFirst({
      where: { ticketCode: ticketCode },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ingresso não encontrado.', valid: false }
      );
    }

    // If an eventId is provided, check if the ticket is for that event
    if (eventId && ticket.eventId !== eventId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Este ingresso é para outro evento.', 
          valid: false,
          ticket: {
            id: ticket.id,
            buyerName: ticket.buyerName,
            eventTitle: ticket.event.title,
            eventDate: ticket.event.date,
          }
        }
      );
    }

    // Check if ticket is already used
    if (ticket.usedAt) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Este ingresso já foi utilizado.', 
          valid: false,
          usedAt: ticket.usedAt,
          usedBy: ticket.usedBy,
          ticket: {
            id: ticket.id,
            buyerName: ticket.buyerName,
            eventTitle: ticket.event.title,
            eventDate: ticket.event.date,
            quantity: ticket.quantity,
          }
        }
      );
    }

    // Check if ticket is approved
    if (ticket.status !== 'approved') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Ingresso com status: ${ticket.status}. Aguarde a confirmação do pagamento.`, 
          valid: false,
          ticket: {
            id: ticket.id,
            buyerName: ticket.buyerName,
            eventTitle: ticket.event.title,
            eventDate: ticket.event.date,
            status: ticket.status,
          }
        }
      );
    }

    // Mark ticket as used
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        usedAt: new Date(),
        usedBy: adminEmail || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ingresso validado com sucesso!',
      valid: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        buyerPhone: ticket.buyerPhone,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventLocation: ticket.event.location,
        quantity: ticket.quantity,
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// GET method to validate by ticket ID (alternative method)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');
    const eventId = searchParams.get('eventId');
    const adminEmail = searchParams.get('adminEmail');

    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: 'ID do ingresso não fornecido.' },
        { status: 400 }
      );
    }

    // Find ticket by ID
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ingresso não encontrado.', valid: false }
      );
    }

    // If an eventId is provided, check if the ticket is for that event
    if (eventId && ticket.eventId !== eventId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Este ingresso é para outro evento.', 
          valid: false,
          ticket: {
            id: ticket.id,
            buyerName: ticket.buyerName,
            eventTitle: ticket.event.title,
            eventDate: ticket.event.date,
          }
        }
      );
    }

    // Check if ticket is already used
    if (ticket.usedAt) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Este ingresso já foi utilizado.', 
          valid: false,
          usedAt: ticket.usedAt,
          usedBy: ticket.usedBy,
          ticket: {
            id: ticket.id,
            buyerName: ticket.buyerName,
            eventTitle: ticket.event.title,
            eventDate: ticket.event.date,
            quantity: ticket.quantity,
          }
        }
      );
    }

    // Check if ticket is approved
    if (ticket.status !== 'approved') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Ingresso com status: ${ticket.status}. Aguarde a confirmação do pagamento.`, 
          valid: false,
          ticket: {
            id: ticket.id,
            buyerName: ticket.buyerName,
            eventTitle: ticket.event.title,
            eventDate: ticket.event.date,
            status: ticket.status,
          }
        }
      );
    }

    // Mark ticket as used
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        usedAt: new Date(),
        usedBy: adminEmail || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ingresso validado com sucesso!',
      valid: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        buyerPhone: ticket.buyerPhone,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventLocation: ticket.event.location,
        quantity: ticket.quantity,
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
