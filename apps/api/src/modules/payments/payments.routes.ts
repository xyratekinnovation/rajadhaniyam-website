import { Hono } from "hono";
import { paymentVerifySchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { rateLimit } from "../../middleware/rateLimit";
import { paymentsService } from "./payments.service";

export const paymentsRoutes = new Hono();

const verifyRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, name: "payments-verify" });

paymentsRoutes.post("/verify", verifyRateLimit, async (c) => {
  const parsed = paymentVerifySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));

  const order = await paymentsService.verifyCheckoutPayment(parsed.data);
  return c.json(ok(order));
});

// Razorpay signs the raw request body — must read text() before parsing JSON.
paymentsRoutes.post("/webhook", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-razorpay-signature");

  if (!paymentsService.isWebhookSignatureValid(rawBody, signature)) {
    throw new HttpError(400, "Invalid webhook signature");
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "Invalid webhook payload");
  }

  const result = await paymentsService.handleWebhookEvent(
    event as Parameters<typeof paymentsService.handleWebhookEvent>[0],
  );
  return c.json(ok(result));
});

paymentsRoutes.get("/:orderId/status", async (c) => {
  const status = await paymentsService.getStatus(c.req.param("orderId")!);
  return c.json(ok(status));
});
