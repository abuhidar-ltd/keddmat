import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  quantity: number;
  merchant_id: string;
  merchant_name: string;
  currency: string;
  merchant_slug?: string;
  has_delivery?: boolean;
  delivery_cost?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearMerchantItems: (merchantId: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  getMerchantItems: (merchantId: string) => CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'shopping_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) { return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i); }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => { setItems(prev => prev.filter(i => i.id !== id)); };
  
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => { setItems([]); };
  const clearMerchantItems = (merchantId: string) => { setItems(prev => prev.filter(i => i.merchant_id !== merchantId)); };
  const getTotal = () => { return items.reduce((sum, item) => sum + item.price * item.quantity, 0); };
  const getItemCount = () => { return items.reduce((sum, item) => sum + item.quantity, 0); };
  const getMerchantItems = (merchantId: string) => { return items.filter(i => i.merchant_id === merchantId); };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, clearMerchantItems, getTotal, getItemCount, getMerchantItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};