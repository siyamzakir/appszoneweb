import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { stripe, HOSTING_PLANS, type PlanSlug, type BillingInterval } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { planSlug, billingInterval } = body as {
      planSlug: PlanSlug;
      billingInterval: BillingInterval;
    };

    const plan = HOSTING_PLANS[planSlug];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    if (planSlug === "starter") {
      return NextResponse.json({ message: "Starter plan is free. No payment required." });
    }

    const priceId =
      billingInterval === "annual" ? plan.annualPriceId : plan.monthlyPriceId;

    if (!priceId) {
      return NextResponse.json(
        { error: "Plan price not configured. Please contact support." },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
      });
      customerId = customer.id;
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?success=true&plan=${planSlug}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        planSlug,
        billingInterval,
        userId: String(user?.id ?? ""),
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: { planSlug, billingInterval },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
