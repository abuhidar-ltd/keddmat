export interface Profile {
  user_id: string;
  store_name: string | null;
  store_description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  page_slug: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  subscription_expires_at: string | null;
}

export interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  delivery_available: boolean;
  delivery_price: number | null;
  created_at: string;
}

export interface StoreAnalyticsEvent {
  id: string;
  store_id: string;
  event_type: 'link_click' | 'whatsapp_click' | 'product_view';
  product_id: string | null;
  created_at: string;
}

export interface PaymentReceipt {
  id: string;
  user_id: string;
  receipt_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
