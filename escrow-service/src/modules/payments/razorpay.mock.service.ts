import { logger } from '../../utils/logger';

// Mock Razorpay types for testing
export interface MockOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
  notes: Record<string, string>;
  created_at: number;
}

export interface MockPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: any;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  created_at: number;
}

export interface MockTransfer {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  recipient_id: string;
  notes?: Record<string, string>;
  created_at: number;
}

export interface MockRefund {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
  created_at: number;
}

export class MockRazorpayService {
  private mockOrders: Map<string, MockOrder> = new Map();
  private mockPayments: Map<string, MockPayment> = new Map();
  private mockTransfers: Map<string, MockTransfer> = new Map();
  private mockRefunds: Map<string, MockRefund> = new Map();
  private orderCounter = 1;
  private paymentCounter = 1;
  private transferCounter = 1;
  private refundCounter = 1;

  constructor() {
    logger.info('Mock Razorpay service initialized for testing');
  }

  /**
   * Create a mock Razorpay order
   */
  async createOrder(options: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<MockOrder> {
    const orderId = `order_mock_${this.orderCounter++}`;
    const mockOrder: MockOrder = {
      id: orderId,
      entity: 'order',
      amount: options.amount,
      currency: options.currency,
      status: 'created',
      receipt: options.receipt || '',
      notes: options.notes || {},
      created_at: Date.now()
    };

    this.mockOrders.set(orderId, mockOrder);
    
    logger.info('Mock order created', { 
      order_id: orderId, 
      amount: options.amount,
      notes: options.notes 
    });

    return mockOrder;
  }

  /**
   * Fetch a mock order by ID
   */
  async fetchOrder(orderId: string): Promise<MockOrder> {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Fetch a mock payment by ID
   */
  async fetchPayment(paymentId: string): Promise<MockPayment> {
    const payment = this.mockPayments.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  /**
   * Create a mock transfer
   */
  async createTransfer(options: {
    amount: number;
    account: string;
    currency?: string;
    notes?: Record<string, string>;
  }): Promise<MockTransfer> {
    const transferId = `trf_mock_${this.transferCounter++}`;
    const mockTransfer: MockTransfer = {
      id: transferId,
      entity: 'transfer',
      amount: options.amount,
      currency: options.currency || 'INR',
      status: 'processed',
      recipient_id: options.account,
      notes: options.notes || {},
      created_at: Date.now()
    };

    this.mockTransfers.set(transferId, mockTransfer);
    
    logger.info('Mock transfer created', { 
      transfer_id: transferId, 
      amount: options.amount,
      account: options.account 
    });

    return mockTransfer;
  }

  /**
   * Create a mock refund
   */
  async createRefund(options: {
    payment_id: string;
    amount?: number;
    notes?: Record<string, string>;
  }): Promise<MockRefund> {
    const refundId = `refund_mock_${this.refundCounter++}`;
    const payment = this.mockPayments.get(options.payment_id);
    
    if (!payment) {
      throw new Error('Payment not found for refund');
    }

    const mockRefund: MockRefund = {
      id: refundId,
      entity: 'refund',
      amount: options.amount || payment.amount,
      currency: payment.currency,
      payment_id: options.payment_id,
      status: 'processed',
      created_at: Date.now()
    };

    this.mockRefunds.set(refundId, mockRefund);
    
    logger.info('Mock refund created', { 
      refund_id: refundId, 
      payment_id: options.payment_id,
      amount: mockRefund.amount 
    });

    return mockRefund;
  }

  /**
   * Verify webhook signature (always returns true for mock)
   */
  verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string,
    webhookSecret: string
  ): boolean {
    logger.info('Mock webhook signature verification', { 
      isValid: true,
      bodyLength: webhookBody.length
    });
    return true;
  }

  /**
   * Create a mock Razorpay account
   */
  async createAccount(options: {
    name: string;
    email: string;
    phone?: string;
    type?: 'standard' | 'business';
  }): Promise<{ id: string }> {
    const accountId = `acc_mock_${Date.now()}`;
    
    logger.info('Mock account created', { 
      account_id: accountId,
      email: options.email 
    });
    
    return { id: accountId };
  }

  /**
   * Fetch mock account details
   */
  async fetchAccount(accountId: string): Promise<{ id: string }> {
    logger.info('Mock account fetched', { account_id: accountId });
    return { id: accountId };
  }

  /**
   * Get mock public key
   */
  getPublicKey(): string {
    return 'rzp_test_mock_key_for_testing';
  }

  /**
   * Simulate payment capture for testing
   */
  async simulatePaymentCapture(orderId: string): Promise<MockPayment> {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const paymentId = `pay_mock_${this.paymentCounter++}`;
    const mockPayment: MockPayment = {
      id: paymentId,
      entity: 'payment',
      amount: order.amount,
      currency: order.currency,
      status: 'captured',
      order_id: orderId,
      international: false,
      method: 'card',
      amount_refunded: 0,
      captured: true,
      notes: order.notes,
      created_at: Date.now()
    };

    this.mockPayments.set(paymentId, mockPayment);
    
    logger.info('Mock payment captured', { 
      payment_id: paymentId,
      order_id: orderId,
      amount: order.amount
    });

    return mockPayment;
  }

  /**
   * Get mock data for testing
   */
  getMockData() {
    return {
      orders: Array.from(this.mockOrders.values()),
      payments: Array.from(this.mockPayments.values()),
      transfers: Array.from(this.mockTransfers.values()),
      refunds: Array.from(this.mockRefunds.values())
    };
  }

  /**
   * Clear all mock data
   */
  clearMockData() {
    this.mockOrders.clear();
    this.mockPayments.clear();
    this.mockTransfers.clear();
    this.mockRefunds.clear();
    this.orderCounter = 1;
    this.paymentCounter = 1;
    this.transferCounter = 1;
    this.refundCounter = 1;
    logger.info('Mock data cleared');
  }

  /**
   * Static utility methods (same as real service)
   */
  static convertToPaise(amount: number): number {
    return Math.round(amount * 100);
  }

  static convertToRupees(amount: number): number {
    return amount / 100;
  }
}
