import type { Order, PaymentVerifyInput } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { ordersService } from "../orders/orders.service";
import { verifyPaymentSignature, verifyWebhookSignature } from "./razorpay.client";

export const paymentsService = {
  verifyCheckoutPayment: async (input: PaymentVerifyInput): Promise<Order> => {
    const order = await ordersService.getById(input.orderId);
    if (!order) throw new HttpError(404, "Order not found");

    if (order.paymentStatus === "paid") {
      return order;
    }

    if (order.status === "cancelled") {
      throw new HttpError(409, "This order was cancelled");
    }

    const matched = await ordersService.findByRazorpayOrderId(input.razorpayOrderId);
    if (!matched || matched.id !== input.orderId) {
      throw new HttpError(400, "Payment does not match this order");
    }

    const valid = verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );
    if (!valid) {
      throw new HttpError(400, "Invalid payment signature");
    }

    return ordersService.markPaymentPaid(input.orderId);
  },

  getStatus: async (
    orderId: string,
  ): Promise<{ orderId: string; paymentStatus: Order["paymentStatus"]; status: Order["status"] }> => {
    const order = await ordersService.getById(orderId);
    if (!order) throw new HttpError(404, "Order not found");
    return {
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      status: order.status,
    };
  },

  /**
   * Handle Razorpay webhook events. Signature must be verified by the route
   * against the raw body before calling this.
   */
  handleWebhookEvent: async (event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  }): Promise<{ handled: boolean }> => {
    const type = event.event;
    const entity = event.payload?.payment?.entity;
    const razorpayOrderId = entity?.order_id;

    if (!razorpayOrderId) {
      return { handled: false };
    }

    const order = await ordersService.findByRazorpayOrderId(razorpayOrderId);
    if (!order) {
      // Not our order (or already cleaned up) — acknowledge so Razorpay stops retrying.
      return { handled: false };
    }

    if (type === "payment.captured" || entity?.status === "captured") {
      if (order.paymentStatus !== "paid") {
        await ordersService.markPaymentPaid(order.id);
      }
      return { handled: true };
    }

    if (type === "payment.failed") {
      if (order.paymentStatus !== "paid" && order.status !== "cancelled") {
        await ordersService.markPaymentFailed(order.id);
      }
      return { handled: true };
    }

    return { handled: false };
  },

  /** Exposed for the webhook route to verify the raw body signature. */
  isWebhookSignatureValid: (rawBody: string, signature: string | undefined) =>
    verifyWebhookSignature(rawBody, signature),
};
