import { Hono } from "hono";
import { notImplemented } from "../../utils/response";

// No payment gateway is integrated yet (Phase 9). These routes are placeholders
// for the create-intent / verify-webhook shape most Indian gateways expect.
export const paymentsRoutes = new Hono();

paymentsRoutes.post("/create-intent", (c) =>
  c.json(notImplemented("Payment intent creation"), 501),
);
paymentsRoutes.post("/webhook", (c) => c.json(notImplemented("Payment webhook handling"), 501));
paymentsRoutes.get("/:orderId/status", (c) => c.json(notImplemented("Payment status lookup"), 501));
