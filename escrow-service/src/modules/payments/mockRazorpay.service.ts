import { logger } from '../../utils/logger';

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

export class MockRazorpayService {
  private mockOrders: Map<string, MockOrder> = new Map();
  private orderCounter = 1;

  constructor() {
    logger.info('Mock Razorpay service initialized for development');
  }

  /**
   * Create a mock Razorpay order
   * Format: order_MOCK + random string
   */
  async createOrder(options: {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<MockOrder> {
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    const orderId = `order_MOCK_${randomString}`;
    
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
      currency: options.currency
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
   * Generate mock payment ID
   * Format: pay_MOCK + random string
   */
  generateMockPaymentId(): string {
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `pay_MOCK_${randomString}`;
  }

  /**
   * Generate mock transfer ID
   * Format: trf_MOCK + random string
   */
  generateMockTransferId(): string {
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `trf_MOCK_${randomString}`;
  }

  /**
   * Get public key (mock)
   */
  getPublicKey(): string {
    return 'rzp_test_MOCK_KEY_FOR_DEVELOPMENT';
  }

  /**
   * Clear all mock data
   */
  clearMockData(): void {
    this.mockOrders.clear();
    this.orderCounter = 1;
    logger.info('Mock data cleared');
  }

  /**
   * Get mock data status
   */
  getMockData() {
    return {
      orders: Array.from(this.mockOrders.values()),
      order_count: this.mockOrders.size
    };
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
