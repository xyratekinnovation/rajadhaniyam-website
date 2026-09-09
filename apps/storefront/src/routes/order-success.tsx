import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BtnLink, Divider, Eyebrow } from "@/components/site/ui";

export const Route = createFileRoute("/order-success")({
  head: () => ({
    meta: [
      { title: "Order Confirmed — Rajadhaniyam" },
      {
        name: "description",
        content: "Thank you for your Rajadhaniyam order. It is being packed now.",
      },
      { property: "og:title", content: "Order Confirmed — Rajadhaniyam" },
      { property: "og:description", content: "Your millet pantry order is confirmed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-olive text-paper">
          <Check className="h-7 w-7" />
        </div>
        <Eyebrow className="mt-8 justify-center">Step 3 of 3</Eyebrow>
        <h1 className="mt-4 font-display text-5xl">Thank you for your order</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Order <span className="text-charcoal">#RJD-24817</span> is confirmed. We will send
          tracking details to your email as soon as it leaves our Coimbatore packhouse.
        </p>
        <Divider className="my-10" />
        <div className="flex flex-wrap justify-center gap-4">
          <BtnLink to="/shop">Continue Shopping</BtnLink>
          <BtnLink to="/contact" variant="outline">
            Need Help?
          </BtnLink>
        </div>
      </section>
    </SiteLayout>
  );
}
