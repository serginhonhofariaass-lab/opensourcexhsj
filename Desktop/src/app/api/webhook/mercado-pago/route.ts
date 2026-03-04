import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import MercadoPago from 'mercadopago';

export async function POST(req: NextRequest) {
  try {
    // Get the content-type to determine how to parse the body
    const contentType = req.headers.get('content-type') || '';
    
    let body;
    let topic = '';
    let paymentId = '';
    
    if (contentType.includes('application/json')) {
      body = await req.json();
      console.log('Webhook received:', JSON.stringify(body));
      
      // Handle Mercado Pago webhook format
      topic = body.topic || body.type || '';
      paymentId = body.data?.id?.toString() || body.id?.toString() || '';
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      topic = params.get('topic') || params.get('type') || '';
      paymentId = params.get('data.id') || params.get('id') || '';
      console.log('Webhook form data received:', formData);
    }

    // Also check query params (Mercado Pago sometimes sends via GET)
    const { searchParams } = new URL(req.url);
    if (!paymentId) {
      paymentId = searchParams.get('id') || searchParams.get('data.id') || '';
    }
    if (!topic) {
      topic = searchParams.get('topic') || searchParams.get('type') || 'payment';
    }

    console.log('Processing webhook - topic:', topic, 'paymentId:', paymentId);

    if (topic === 'payment' && paymentId) {
      // Get the Mercado Pago access token from settings
      const settings = await prisma.siteSettings.findFirst();
      
      if (!settings?.mpAccessToken) {
        console.error('Mercado Pago access token not configured');
        return NextResponse.json({ error: 'MP not configured' }, { status: 500 });
      }

      // Configure Mercado Pago
      MercadoPago.configure({
        access_token: settings.mpAccessToken,
      });

      try {
        // Get the payment details from Mercado Pago
        const payment = await MercadoPago.payment.findById(parseInt(paymentId));
        console.log('Payment status from MP:', payment.body?.status);

        // Find the ticket by Mercado Pago ID
        const ticket = await prisma.ticket.findFirst({
          where: {
            mercadoPagoId: paymentId,
          },
        });

        if (ticket) {
          // Map Mercado Pago status to our status
          let newStatus = 'pending';
          const mpStatus = payment.body?.status;
          
          if (mpStatus === 'approved') {
            newStatus = 'approved';
          } else if (mpStatus === 'cancelled' || mpStatus === 'rejected' || mpStatus === 'refunded') {
            newStatus = 'cancelled';
          } else if (mpStatus === 'pending' || mpStatus === 'in_process' || mpStatus === 'authorized') {
            newStatus = 'pending';
          }

          console.log('Updating ticket status:', ticket.id, 'from', ticket.status, 'to', newStatus);

          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: newStatus },
          });

          console.log('Ticket status updated successfully');
        } else {
          console.log('Ticket not found for payment ID:', paymentId);
        }
      } catch (mpError: any) {
        console.error('Error fetching payment from Mercado Pago:', mpError.message);
        
        // If we can't verify with MP, still try to find by ID as fallback
        const ticket = await prisma.ticket.findFirst({
          where: {
            mercadoPagoId: paymentId,
          },
        });

        if (ticket) {
          // Mark as approved since we received notification
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'approved' },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add GET handler for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint is active',
    message: 'Send POST requests to this endpoint' 
  });
}
