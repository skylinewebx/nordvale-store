import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "../config/assets";
import { Category, effectivePrice, getProduct } from "../data/products";

export interface CartItem { key: string; slug: string; colorId: string; size: string; qty: number }
export interface Order { id: string; date: string; items: CartItem[]; total: number; method: string; email: string; name: string }

export const PROMOS: Record<string, { type: "pct" | "flat"; value: number; label: string }> = {
  WINTER10: { type: "pct", value: 10, label: "10% off" },
  FIRSTFROST: { type: "pct", value: 15, label: "15% off" },
  WARMUP: { type: "flat", value: 20, label: "$20 off" },
};

interface State {
  cart: CartItem[];
  wishlist: string[];
  recent: string[];
  promo: string | null;
  lastOrder: Order | null;
  orders: Order[];
  cookies: "unset" | "accepted" | "declined";
  cartOpen: boolean;
  searchOpen: boolean;
  wishlistOpen: boolean;
  openProduct: string | null;
  heroCat: Category; // category shown by the showcase hero (not persisted)
  setHeroCat: (c: Category) => void;
  addToCart: (i: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clearCart: () => void;
  toggleWish: (slug: string) => void;
  liked: string[];
  toggleLike: (id: string) => void;
  picked: Record<string, string>; // selected colour per product, kept for the session (list ↔ detail stay in sync)
  pickColor: (slug: string, colorId: string) => void;
  viewed: (slug: string) => void;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  placeOrder: (p: { method: string; email: string; name: string }) => Order;
  setCookies: (v: "accepted" | "declined") => void;
  set: (p: Partial<Pick<State, "cartOpen" | "searchOpen" | "wishlistOpen" | "openProduct">>) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      liked: [],
      heroCat: "hoodies" as Category,
      setHeroCat: (c) => set({ heroCat: c }),
      picked: {},
      pickColor: (slug, colorId) => set((s) => (s.picked[slug] === colorId ? s : { picked: { ...s.picked, [slug]: colorId } })),
      toggleLike: (id) => set((s) => ({ liked: s.liked.includes(id) ? s.liked.filter((l) => l !== id) : [...s.liked, id] })),
      cart: [], wishlist: [], recent: [], promo: null, lastOrder: null, orders: [], cookies: "unset",
      cartOpen: false, searchOpen: false, wishlistOpen: false, openProduct: null,
      addToCart: (i) =>
        set((s) => {
          const key = `${i.slug}|${i.colorId}|${i.size}`;
          const ex = s.cart.find((c) => c.key === key);
          const cart = ex ? s.cart.map((c) => (c.key === key ? { ...c, qty: Math.min(10, c.qty + i.qty) } : c)) : [...s.cart, { ...i, key }];
          return { cart, cartOpen: true };
        }),
      setQty: (key, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter((c) => c.key !== key) : s.cart.map((c) => (c.key === key ? { ...c, qty: Math.min(10, qty) } : c)) })),
      remove: (key) => set((s) => ({ cart: s.cart.filter((c) => c.key !== key) })),
      clearCart: () => set({ cart: [], promo: null }),
      toggleWish: (slug) => set((s) => ({ wishlist: s.wishlist.includes(slug) ? s.wishlist.filter((w) => w !== slug) : [...s.wishlist, slug] })),
      viewed: (slug) => set((s) => ({ recent: [slug, ...s.recent.filter((r) => r !== slug)].slice(0, 6) })),
      applyPromo: (code) => {
        const k = code.trim().toUpperCase();
        if (PROMOS[k]) { set({ promo: k }); return true; }
        return false;
      },
      clearPromo: () => set({ promo: null }),
      placeOrder: ({ method, email, name }) => {
        const s = get();
        const t = totals(s.cart, s.promo);
        const order: Order = { id: "NV" + Math.random().toString(36).slice(2, 8).toUpperCase(), date: new Date().toISOString(), items: s.cart, total: t.total, method, email, name };
        set({ lastOrder: order, orders: [order, ...s.orders], cart: [], promo: null });
        return order;
      },
      setCookies: (v) => set({ cookies: v }),
      set: (p) => set(p),
    }),
    {
      name: "nordvale-store-v2", // v2: catalog changed (no designs); old carts are dropped
      version: 2,
      partialize: (s) => ({ liked: s.liked, cart: s.cart, wishlist: s.wishlist, recent: s.recent, promo: s.promo, lastOrder: s.lastOrder, orders: s.orders, cookies: s.cookies }),
    }
  )
);

export function totals(cart: CartItem[], promo: string | null) {
  const subtotal = cart.reduce((sum, i) => {
    const p = getProduct(i.slug);
    if (!p) return sum;
    return sum + effectivePrice(p) * i.qty;
  }, 0);
  const pr = promo ? PROMOS[promo] : null;
  const discount = pr ? (pr.type === "pct" ? subtotal * (pr.value / 100) : Math.min(pr.value, subtotal)) : 0;
  const after = subtotal - discount;
  const shipping = cart.length === 0 || after >= BRAND.freeShippingThreshold ? 0 : BRAND.shippingFlat;
  return { subtotal, discount, shipping, total: after + shipping, remaining: Math.max(0, BRAND.freeShippingThreshold - after), count: cart.reduce((n, i) => n + i.qty, 0) };
}
