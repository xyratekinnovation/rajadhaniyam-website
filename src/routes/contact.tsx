import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Btn, Eyebrow } from "@/components/site/ui";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Rajadhaniyam" },
      {
        name: "description",
        content: "Questions about orders, bulk supply or partnerships? Reach the Rajadhaniyam team.",
      },
      { property: "og:title", content: "Contact Us — Rajadhaniyam" },
      { property: "og:description", content: "Talk to the Rajadhaniyam team about orders and bulk supply." },
    ],
  }),
  component: Contact,
});

const field = "h-11 w-full border border-input bg-paper px-4 text-sm outline-none focus:border-olive";

function Contact() {
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-8">
          <Eyebrow>We would love to hear from you</Eyebrow>
          <h1 className="font-display text-5xl leading-tight">Get in touch</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our team replies within one working day. For bulk and export enquiries, please mention
            quantities in your message.
          </p>
          <ul className="space-y-5 text-sm">
            <li className="flex gap-4">
              <MapPin className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} />
              <span className="text-muted-foreground">
                Rajadhaniyam Foods, 14 Mill Road, Peelamedu, Coimbatore 641004, Tamil Nadu
              </span>
            </li>
            <li className="flex gap-4">
              <Phone className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} />
              <span className="text-muted-foreground">+91 98400 12345</span>
            </li>
            <li className="flex gap-4">
              <Mail className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} />
              <span className="text-muted-foreground">care@rajadhaniyam.in</span>
            </li>
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Thanks — we'll get back to you shortly.");
            (e.target as HTMLFormElement).reset();
          }}
          className="space-y-4 border border-border bg-paper p-8"
        >
          <h2 className="font-display text-2xl">Send a message</h2>
          <input required placeholder="Your name" className={field} />
          <input required type="email" placeholder="Email address" className={field} />
          <input placeholder="Subject" className={field} />
          <textarea
            required
            rows={6}
            placeholder="How can we help?"
            className="w-full border border-input bg-paper p-4 text-sm outline-none focus:border-olive"
          />
          <Btn type="submit" className="w-full">
            Send Message
          </Btn>
        </form>
      </div>
    </SiteLayout>
  );
}
