// ─────────────────────────────────────────────────────────────
// PAYMENT PLACEHOLDERS — nothing here moves real money.
// Card numbers are never collected by this front-end. Wire each method to its provider
// on a SERVER (never put secret keys in a Vite env var; only VITE_* values are public).
// ─────────────────────────────────────────────────────────────

export type PayMethod = "cod" | "card" | "wallet" | "intl";

export const PAY_METHODS: { id: PayMethod; title: string; note: string }[] = [
  { id: "cod", title: "Cash on Delivery", note: "Pay in cash when your order arrives. Available domestically." },
  { id: "card", title: "Credit / Debit Card", note: "Secure card payment (Stripe-ready placeholder)." },
  { id: "wallet", title: "Mobile Wallet", note: "JazzCash or Easypaisa. You'll confirm on your phone." },
  { id: "intl", title: "International (PayPal / Stripe)", note: "For customers outside Pakistan." },
];

export interface PayResult { status: "pending" | "paid"; reference?: string; message: string }

export async function startPayment(method: PayMethod, _amount: number, _extra?: { walletNumber?: string; walletProvider?: string }): Promise<PayResult> {
  switch (method) {
    case "cod":
      return { status: "pending", message: "Pay in cash on delivery." };
    case "card":
      // TODO(Stripe): POST /api/create-payment-intent { amount, currency } → clientSecret.
      //   Mount <Elements> + <PaymentElement> with VITE_STRIPE_PUBLISHABLE_KEY, then stripe.confirmPayment().
      //   Server env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
      return { status: "pending", message: "Demo mode: card payment not connected." };
    case "wallet":
      // TODO(JazzCash / Easypaisa): call your server, which signs the request with
      //   JAZZCASH_MERCHANT_ID / JAZZCASH_PASSWORD / JAZZCASH_INTEGRITY_SALT (or EASYPAISA_STORE_ID / EASYPAISA_HASH_KEY)
      //   and returns a hosted-checkout redirect or MWALLET transaction ref. Confirm via IPN webhook.
      return { status: "pending", message: "Demo mode: wallet payment not connected." };
    case "intl":
      // TODO(PayPal): use @paypal/react-paypal-js with VITE_PAYPAL_CLIENT_ID; create/capture the order on the server
      //   (PAYPAL_CLIENT_SECRET). Or route to Stripe Checkout with VITE_STRIPE_PUBLISHABLE_KEY.
      return { status: "pending", message: "Demo mode: international payment not connected." };
  }
}
