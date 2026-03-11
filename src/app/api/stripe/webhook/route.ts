import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(sub);
        break;
      }
      default:
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { planSlug, billingInterval, userId } = session.metadata ?? {};
  if (!planSlug || !userId) return;

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) return;

  const stripeSubId = session.subscription as string;
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  const periodEnd = (stripeSub as unknown as { current_period_end: number }).current_period_end;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: stripeSubId },
    update: {},
    create: {
      userId: Number(userId),
      planId: plan.id,
      stripeSubscriptionId: stripeSubId,
      stripeCurrentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
      status: "active",
      billingInterval: billingInterval ?? "monthly",
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;

  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subId = invoiceAny["subscription"] as string | undefined;

  const sub = subId
    ? await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } })
    : null;

  try {
    await prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId: sub?.id ?? undefined,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_paid ?? 0) / 100,
        currency: invoice.currency,
        status: "succeeded",
        receiptUrl: (invoiceAny["hosted_invoice_url"] as string | undefined) ?? undefined,
      },
    });
  } catch {
    // duplicate invoice — ignore
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;

  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subId = invoiceAny["subscription"] as string | undefined;

  try {
    await prisma.payment.create({
      data: {
        userId: user.id,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_due ?? 0) / 100,
        currency: invoice.currency,
        status: "failed",
      },
    });
  } catch {
    // duplicate invoice — ignore
  }

  if (subId) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subId },
      data: { status: "past_due" },
    });
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const subAny = sub as unknown as Record<string, unknown>;
  const periodEnd = subAny["current_period_end"] as number;

  const status =
    sub.status === "active" ? "active"
    : sub.status === "canceled" ? "canceled"
    : sub.status === "past_due" ? "past_due"
    : sub.status === "trialing" ? "trialing"
    : "canceled";

  await prisma.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status,
      stripeCurrentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}
