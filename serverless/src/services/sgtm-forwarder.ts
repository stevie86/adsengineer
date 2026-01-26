export interface SGTMConfig {
  container_url: string;
  measurement_id: string;
  api_secret?: string;
}

export interface SGTMEventData {
  client_id: string;
  event_name: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
  user_data?: {
    email_address?: string;
    phone_number?: string;
    address?: {
      first_name?: string;
      last_name?: string;
      street?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
    };
  };
  page_location?: string;
  page_referrer?: string;
  ip_override?: string;
  user_agent?: string;
}

export interface SGTMPurchaseData {
  order_id: string;
  total: number;
  currency: string;
  customer_email?: string;
  customer_phone?: string;
  customer_ip?: string;
  user_agent?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface SGTMResult {
  success: boolean;
  error?: string;
  status_code?: number;
}

async function hashSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateClientId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 1000000000);
  return `${random}.${timestamp}`;
}

export class SGTMForwarder {
  private config: SGTMConfig;

  constructor(config: SGTMConfig) {
    this.config = config;
  }

  async sendEvent(event: SGTMEventData): Promise<SGTMResult> {
    const params = new URLSearchParams();
    params.append('v', '2');
    params.append('tid', this.config.measurement_id);
    params.append('cid', event.client_id);
    params.append('en', event.event_name);

    if (event.currency) {
      params.append('ep.currency', event.currency);
    }
    if (event.value !== undefined) {
      params.append('epn.value', event.value.toString());
    }
    if (event.transaction_id) {
      params.append('ep.transaction_id', event.transaction_id);
    }

    if (event.user_data?.email_address) {
      const hashedEmail = await hashSHA256(event.user_data.email_address.toLowerCase().trim());
      params.append('ep.user_data.sha256_email_address', hashedEmail);
    }
    if (event.user_data?.phone_number) {
      const normalizedPhone = event.user_data.phone_number.replace(/\D/g, '');
      const hashedPhone = await hashSHA256(normalizedPhone);
      params.append('ep.user_data.sha256_phone_number', hashedPhone);
    }

    if (event.ip_override) {
      params.append('ep.ip_override', event.ip_override);
    }
    if (event.user_agent) {
      params.append('ep.user_agent', event.user_agent);
    }
    if (event.page_location) {
      params.append('ep.page_location', event.page_location);
    }
    if (event.page_referrer) {
      params.append('ep.page_referrer', event.page_referrer);
    }

    if (event.items && event.items.length > 0) {
      params.append('ep.items', JSON.stringify(event.items));
    }

    const collectUrl = this.config.api_secret
      ? `${this.config.container_url}/g/collect?api_secret=${this.config.api_secret}`
      : `${this.config.container_url}/g/collect`;

    try {
      const response = await fetch(collectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status,
        };
      }

      return { success: true, status_code: response.status };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendPurchase(purchase: SGTMPurchaseData): Promise<SGTMResult> {
    return this.sendEvent({
      client_id: generateClientId(),
      event_name: 'purchase',
      transaction_id: purchase.order_id,
      value: purchase.total,
      currency: purchase.currency,
      user_data: {
        email_address: purchase.customer_email,
        phone_number: purchase.customer_phone,
      },
      ip_override: purchase.customer_ip,
      user_agent: purchase.user_agent,
      items: purchase.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  async sendAddToCart(data: {
    client_id?: string;
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    currency: string;
    customer_ip?: string;
    user_agent?: string;
  }): Promise<SGTMResult> {
    return this.sendEvent({
      client_id: data.client_id || generateClientId(),
      event_name: 'add_to_cart',
      currency: data.currency,
      value: data.price * data.quantity,
      ip_override: data.customer_ip,
      user_agent: data.user_agent,
      items: [
        {
          item_id: data.item_id,
          item_name: data.item_name,
          price: data.price,
          quantity: data.quantity,
        },
      ],
    });
  }

  async sendBeginCheckout(data: {
    client_id?: string;
    value: number;
    currency: string;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
    customer_ip?: string;
    user_agent?: string;
  }): Promise<SGTMResult> {
    return this.sendEvent({
      client_id: data.client_id || generateClientId(),
      event_name: 'begin_checkout',
      value: data.value,
      currency: data.currency,
      ip_override: data.customer_ip,
      user_agent: data.user_agent,
      items: data.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  async sendLead(data: {
    client_id?: string;
    email?: string;
    phone?: string;
    value?: number;
    currency?: string;
    customer_ip?: string;
    user_agent?: string;
  }): Promise<SGTMResult> {
    return this.sendEvent({
      client_id: data.client_id || generateClientId(),
      event_name: 'generate_lead',
      value: data.value,
      currency: data.currency,
      user_data: {
        email_address: data.email,
        phone_number: data.phone,
      },
      ip_override: data.customer_ip,
      user_agent: data.user_agent,
    });
  }
}

export function createSGTMForwarder(config: SGTMConfig): SGTMForwarder {
  if (!config.container_url || !config.measurement_id) {
    throw new Error('sGTM config requires container_url and measurement_id');
  }
  return new SGTMForwarder(config);
}
