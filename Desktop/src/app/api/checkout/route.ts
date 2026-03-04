import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Access token hardcoded as requested
const MP_ACCESS_TOKEN = 'APP_USR-1697819599118557-030312-e0b9e899c306f8c221ff245b60478c7a-64805535';

// Generate a unique ticket code for validation (barcode format)
function generateTicketCode(): string {
  // Generate a numeric code that looks like a barcode
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventId, 
      eventTitle, 
      buyerName, 
      buyerEmail,
      buyerPhone,
      buyerCpf,
      price,
      quantity,
      totalPrice,
      paymentMethod,
      tierId,
      tierName,
    } = body;

    console.log('Checkout request:', { 
      eventId, 
      eventTitle, 
      buyerName, 
      buyerEmail,
      buyerPhone,
      buyerCpf,
      price,
      quantity,
      totalPrice,
      paymentMethod,
      tierId,
      tierName,
    });

    if (!eventId || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { success: false, message: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    // Generate unique ticket code for this ticket
    const ticketCode = generateTicketCode();

    // Create ticket record with all fields
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        buyerName,
        buyerEmail,
        buyerPhone: buyerPhone || null,
        buyerCpf: buyerCpf || null,
        quantity: quantity || 1,
        totalPrice: totalPrice || price,
        paymentMethod: paymentMethod || 'pix',
        status: 'pending',
        ticketCode: ticketCode,
        tierId: tierId || null,
        tierName: tierName || null,
      },
    });

    console.log('Ticket created:', ticket.id, 'Code:', ticketCode);

    // If price is 0, mark as approved directly
    if (totalPrice === 0 || price === 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'approved' },
      });

      return NextResponse.json({
        success: true,
        ticketId: ticket.id,
        ticketCode: ticketCode,
        message: 'Ingresso reservado com sucesso!',
        isFree: true,
      });
    }

    const firstName = buyerName.split(' ')[0];
    const lastName = buyerName.split(' ').slice(1).join(' ') || '';

    // Clean CPF - only digits
    const cleanCpf = (buyerCpf || '').replace(/\D/g, '');
    // Only include identification if CPF has exactly 11 digits (basic validation)
    const payerIdentification = cleanCpf.length === 11
      ? { identification: { type: 'CPF', number: cleanCpf } }
      : {};

    // Handle different payment methods
    if (paymentMethod === 'pix_parcelado') {
      // PIX Parcelado - Create 2 PIX payments
      const parcelaPrice = Math.ceil((totalPrice || price) / 2);
      
      // First PIX payment
      const paymentData1 = {
        transaction_amount: parcelaPrice / 100,
        description: `Ingresso: ${eventTitle} (1/2)`,
        payment_method_id: 'pix',
        payer: {
          email: buyerEmail,
          first_name: firstName,
          last_name: lastName,
          ...payerIdentification,
        },
        additional_info: {
          payer: {
            first_name: firstName,
            last_name: lastName,
          },
        },
        external_reference: `${ticket.id}-1`,
      };

      const idempotencyKey1 = `${ticket.id}-1-${Date.now()}`;
      
      const mpResponse1 = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey1,
        },
        body: JSON.stringify(paymentData1),
      });

      const responseText1 = await mpResponse1.text();
      const mpData1 = JSON.parse(responseText1);
      
      if (!mpResponse1.ok || mpData1.error) {
        console.log('MP Error 1:', mpData1);
        await prisma.ticket.delete({ where: { id: ticket.id } });
        const errMsg1 = mpData1.message || 'Erro ao criar primeiro pagamento PIX.';
        return NextResponse.json({ success: false, message: errMsg1 }, { status: 400 });
      }

      // Second PIX payment
      const paymentData2 = {
        transaction_amount: parcelaPrice / 100,
        description: `Ingresso: ${eventTitle} (2/2)`,
        payment_method_id: 'pix',
        payer: {
          email: buyerEmail,
          first_name: firstName,
          last_name: lastName,
          ...payerIdentification,
        },
        additional_info: {
          payer: {
            first_name: firstName,
            last_name: lastName,
          },
        },
        external_reference: `${ticket.id}-2`,
      };

      const idempotencyKey2 = `${ticket.id}-2-${Date.now()}`;
      
      const mpResponse2 = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey2,
        },
        body: JSON.stringify(paymentData2),
      });

      const responseText2 = await mpResponse2.text();
      const mpData2 = JSON.parse(responseText2);
      
      if (!mpResponse2.ok || mpData2.error) {
        console.log('MP Error 2:', mpData2);
        await prisma.ticket.delete({ where: { id: ticket.id } });
        const errMsg2 = mpData2.message || 'Erro ao criar segundo pagamento PIX.';
        return NextResponse.json({ success: false, message: errMsg2 }, { status: 400 });
      }

      // Update ticket with both payment IDs
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { 
          mercadoPagoId: String(mpData1.id),
          secondPaymentId: String(mpData2.id),
          status: 'partial'
        },
      });

      // Get payment URLs
      const getPaymentUrl = (mpData: any) => {
        if (mpData.point_of_interaction?.transaction_data?.ticket_url) {
          return mpData.point_of_interaction.transaction_data.ticket_url;
        } else if (mpData.transaction_details?.external_resource_url) {
          return mpData.transaction_details.external_resource_url;
        } else if (mpData.payment_method_id === 'pix' && mpData.id) {
          return `https://www.mercadopago.com.br/pagamentos/${mpData.id}`;
        }
        return null;
      };

      return NextResponse.json({
        success: true,
        ticketId: ticket.id,
        ticketCode: ticketCode,
        paymentMethod: 'pix_parcelado',
        url: getPaymentUrl(mpData1),
        paymentId: mpData1.id,
        secondUrl: getPaymentUrl(mpData2),
        secondPaymentId: mpData2.id,
        parcelaValue: parcelaPrice,
        status: 'pending',
      });

    } else {
      // Regular PIX payment
      const paymentData = {
        transaction_amount: (totalPrice || price) / 100,
        description: `Ingresso: ${eventTitle}`,
        payment_method_id: 'pix',
        payer: {
          email: buyerEmail,
          first_name: firstName,
          last_name: lastName,
          ...payerIdentification,
        },
        additional_info: {
          payer: {
            first_name: firstName,
            last_name: lastName,
          },
        },
        external_reference: ticket.id,
      };

      const idempotencyKey = `${ticket.id}-${Date.now()}`;

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(paymentData),
      });

      const responseText = await mpResponse.text();
      
      if (!responseText) {
        console.log('Empty MP response');
        await prisma.ticket.delete({ where: { id: ticket.id } });
        return NextResponse.json({
          success: false,
          message: 'Erro ao conectar com Mercado Pago. Tente novamente.',
        });
      }

      const mpData = JSON.parse(responseText);
      console.log('MP Response:', JSON.stringify(mpData, null, 2));

      if (mpData.status === 401 || mpData.error === 'unauthorized' || mpData.message?.includes('access_token')) {
        console.log('MP auth error');
        await prisma.ticket.delete({ where: { id: ticket.id } });
        return NextResponse.json({
          success: false,
          message: 'Token do Mercado Pago inválido.',
          needsPaymentSetup: true,
        });
      }

      // Handle any MP error (bad_request, etc.)
      if (!mpResponse.ok || mpData.error) {
        console.log('MP error:', mpData.error, mpData.message);
        await prisma.ticket.delete({ where: { id: ticket.id } });
        const errMsg = mpData.message || mpData.error || 'Erro ao criar pagamento.';
        return NextResponse.json({ success: false, message: errMsg }, { status: 400 });
      }

      if (mpData.status === 'pending' || mpData.status === 'approved' || mpData.status === 'in_process') {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { mercadoPagoId: String(mpData.id) },
        });

        let paymentUrl = null;
        
        if (mpData.point_of_interaction?.transaction_data?.ticket_url) {
          paymentUrl = mpData.point_of_interaction.transaction_data.ticket_url;
        } else if (mpData.transaction_details?.external_resource_url) {
          paymentUrl = mpData.transaction_details.external_resource_url;
        } else if (mpData.payment_method_id === 'pix' && mpData.id) {
          paymentUrl = `https://www.mercadopago.com.br/pagamentos/${mpData.id}`;
        }

        return NextResponse.json({
          success: true,
          url: paymentUrl,
          paymentId: mpData.id,
          ticketId: ticket.id,
          ticketCode: ticketCode,
          status: mpData.status,
          paymentMethod: 'pix',
        });
      }

      const errorMsg = mpData.message || mpData.error || 'Erro ao criar pagamento.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
