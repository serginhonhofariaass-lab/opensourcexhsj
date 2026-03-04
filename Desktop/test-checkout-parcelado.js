const testCheckoutParcelado = async () => {
  const response = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventId: 'd0a79ae6-99ab-4e14-b364-6e94aaf9c997',
      eventTitle: 'Show de Gospel - Louvor e Adoração',
      buyerName: 'Sergio Silva',
      buyerEmail: 'serginhonhofariaass@gmail.com',
      buyerPhone: '81991055245',
      buyerCpf: '13141629420',
      price: 5000,
      quantity: 1,
      totalPrice: 5000,
      paymentMethod: 'pix_parcelado'
    }),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
};

testCheckoutParcelado();
