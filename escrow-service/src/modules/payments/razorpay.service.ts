import Razorpay from 'razorpay';
import { logger } from '../../utils/logger';

export interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number | string;
  currency: string;
  status: string;
  receipt?: string;
  notes?: Record<string, any>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number | string;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded?: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: any;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string | number;
  notes?: Record<string, any>;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  created_at: number;
}

export interface RazorpayTransfer {
  id: string;
  entity: string;
  amount: number | string;
  currency: string;
  status: string;
  recipient?: string;
  notes?: Record<string, any>;
  created_at: number;
}

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    logger.info('Razorpay service initialized', { key_id: keyId });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder> {
    try {
      const order = await this.razorpay.orders.create(options);
      
      logger.info('Razorpay order created', {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      });

      return order;
    } catch (error) {
      logger.error('Error creating Razorpay order', error);
      throw new Error('Failed to create Razorpay order');
    }
  }

  /**
   * Fetch Razorpay order by ID
   */
  async fetchOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      
      logger.info('Razorpay order fetched', {
        order_id: order.id,
        status: order.status,
        amount: order.amount
      });

      return order;
    } catch (error) {
      logger.error('Error fetching Razorpay order', error);
      throw new Error('Failed to fetch Razorpay order');
    }
  }

  /**
   * Fetch Razorpay payment by ID
   */
  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      logger.info('Razorpay payment fetched', {
        payment_id: payment.id,
        order_id: payment.order_id,
        status: payment.status,
        amount: payment.amount
      });

      return payment;
    } catch (error) {
      logger.error('Error fetching Razorpay payment', error);
      throw new Error('Failed to fetch Razorpay payment');
    }
  }

  /**
   * Create transfer to freelancer
   */
  async createTransfer(options: {
    amount: number;
    account_id: string;
    notes?: Record<string, any>;
  }): Promise<RazorpayTransfer> {
    try {
      const transfer = await this.razorpay.transfers.create({
        amount: options.amount,
        account: options.account_id,
        notes: options.notes,
        currency: 'INR'
      });
      
      logger.info('Razorpay transfer created', {
        transfer_id: transfer.id,
        amount: transfer.amount,
        recipient: transfer.recipient
      });

      return transfer;
    } catch (error) {
      logger.error('Error creating Razorpay transfer', error);
      throw new Error('Failed to create Razorpay transfer');
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new Error('Razorpay key secret not configured');
      }

      const body = `${orderId}|${paymentId}`;
      const expectedSignature = require('crypto')
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      logger.info('Payment signature verification', {
        order_id: orderId,
        payment_id: paymentId,
        is_valid: isValid
      });

      return isValid;
    } catch (error) {
      logger.error('Error verifying payment signature', error);
      return false;
    }
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error('Razorpay key ID not configured');
    }
    return keyId;
  }

  /**
   * Convert rupees to paise
   */
  convertToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Convert paise to rupees
   */
  convertToRupees(paise: number): number {
    return Math.round(paise / 100) / 100;
  }
}
