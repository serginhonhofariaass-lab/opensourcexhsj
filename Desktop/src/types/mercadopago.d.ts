declare module 'mercadopago' {
  export interface Payment {
    findById(id: number): Promise<{ body: any }>;
  }

  export interface MerchantOrder {
    findById(id: number): Promise<{ body: any }>;
  }

  export interface ConfigureOptions {
    access_token: string;
  }

  const MercadoPago: {
    configure(options: ConfigureOptions): void;
    payment: Payment;
    merchantOrder: MerchantOrder;
  };

  export default MercadoPago;
}
