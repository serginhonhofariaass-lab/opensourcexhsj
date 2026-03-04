import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Access token hardcoded
const MP_ACCESS_TOKEN = 'APP_USR-3176210632792405-122618-59c853a94fa021b3f7ba773a94d051bb-221805708';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketCode, ticketId, action } = body;

    // Handle manual approve/reject actions from admin dashboard
    if (action && ticketId) {
      if (action === 'approve') {
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'approved' },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Pagamento aprovado com sucesso!',
          ticket: {
            id: updatedTicket.id,
            status: updatedTicket.status,
          }
        });
      }
      
      if (action === 'reject') {
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'cancelled' },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Pagamento rejeitado.',
          ticket: {
            id: updatedTicket.id,
            status: updatedTicket.status,
          }
        });
      }
    }

    // Original check-payment logic for ticketCode verification
    if (!ticketCode) {
      return NextResponse.json(
        { success: false, message: 'Código do ingresso não fornecido.' },
        { status: 400 }
      );
    }

    // Find ticket by code
    const ticket = await prisma.ticket.findFirst({
      where: { ticketCode: ticketCode },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ingresso não encontrado.' }
      );
    }

    // If already approved, return success
    if (ticket.status === 'approved') {
      return NextResponse.json({
        success: true,
        message: 'Ingresso já aprovado!',
        ticket: {
          id: ticket.id,
          status: ticket.status,
          buyerName: ticket.buyerName,
          eventTitle: ticket.event.title,
        }
      });
    }

    // If there's a Mercado Pago ID, check payment status
    if (ticket.mercadoPagoId) {
      try {
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${ticket.mercadoPagoId}`, {
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          },
        });

        if (mpResponse.ok) {
          const mpData = await mpResponse.json();
          
          if (mpData.status === 'approved') {
            // Update ticket status
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { status: 'approved' },
            });

            return NextResponse.json({
              success: true,
              message: 'Pagamento confirmado! Ingresso aprovado.',
              ticket: {
                id: ticket.id,
                status: 'approved',
                buyerName: ticket.buyerName,
                eventTitle: ticket.event.title,
                mpStatus: mpData.status,
              }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `Pagamento ainda não confirmado. Status no Mercado Pago: ${mpData.status}`,
              ticket: {
                id: ticket.id,
                status: ticket.status,
                mpStatus: mpData.status,
              }
            });
          }
        }
      } catch (mpError) {
        console.error('MP API error:', mpError);
      }
    }

    // If free ticket (price = 0), approve directly
    if (ticket.totalPrice === 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'approved' },
      });

      return NextResponse.json({
        success: true,
        message: 'Ingresso gratuito aprovado!',
        ticket: {
          id: ticket.id,
          status: 'approved',
          buyerName: ticket.buyerName,
          eventTitle: ticket.event.title,
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Pagamento não encontrado ou ainda não confirmado.',
      ticket: {
        id: ticket.id,
        status: ticket.status,
        mercadoPagoId: ticket.mercadoPagoId,
      }
    });

  } catch (error) {
    console.error('Check payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// GET method for simple testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticketCode = searchParams.get('ticketCode');

  if (!ticketCode) {
    return NextResponse.json(
      { success: false, message: 'Código não fornecido.' },
      { status: 400 }
    );
  }

  // Simple redirect to POST
  return NextResponse.redirect(new URL(`/api/admin/check-payment?ticketCode=${ticketCode}`, request.url));
}
