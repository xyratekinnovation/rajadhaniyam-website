const KEY = "guest_cart_session";

// A permanent per-browser id, independent of login state — it's how a
// guest's cart is found again on a later visit, and how a login request
// tells the server which guest cart (if any) to merge into the new
// account's cart. Never rotated; unrelated to the customer JWT.
export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
