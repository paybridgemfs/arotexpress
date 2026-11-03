export interface SettingData {
  header_title: string;
  header_subtitle: string;
  footer_text: string;
  footer_address: string;
}

export interface Brand {
  id?: number;
  name: string;
  unit: string;
  price: number;
  cost_price?: number;
  image?: string;
  stock?: number;
  force_stock_out?: boolean;
}

export interface Category {
  id: number;
  en: string;
  bn: string;
  icon: string;
  group: string;
  brands: Brand[];
}

export interface Group {
  id?: number;
  key: string;
  en: string;
  bn: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface PaymentMethod {
  id: number;
  code: string;
  name_bn: string;
  name_en?: string;
  number: string;
  instructions?: string;
  instructions_bn?: string;
  is_active: boolean;
  logo?: string;
  logo_url?: string;
  logo_delete_url?: string;
}

export interface CartItem {
  catId: number;
  catEn: string;
  catBn: string;
  brand: string;
  unit: string;
  price: number;
  cost_price?: number;
  qty: number;
  image?: string;
  stock?: number;
}

export interface Order {
  id: number;
  order_code: string;
  user_id?: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_area: string;
  payment_method: string;
  sender_number?: string;
  trx_id?: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  items_json: CartItem[];
  status: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  created_at: string;
  orders_count?: number;
}
