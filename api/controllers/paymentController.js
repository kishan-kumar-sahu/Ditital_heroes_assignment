import crypto from "node:crypto";
import { Charity, Payment, Subscription } from "../models/index.js";

const RAZORPAY_API = "https://api.razorpay.com/v1";

const getPlanAmount = (plan) => (plan === "yearly" ? 2000 : 199);

function requireGateway(res) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    res.status(503).json({
      error:
        "Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the API environment.",
    });
    return false;
  }
  return true;
}

function gatewayAuth() {
  return `Basic ${Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64")}`;
}

async function razorpay(path, options = {}) {
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: {
      Authorization: gatewayAuth(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.description || "Payment gateway request failed");
  }
  return data;
}

export async function createOrder(req, res) {
  if (!requireGateway(res)) return;

  const plan = req.body.plan || "monthly";
  const contributionPercent = Number(req.body.contributionPercent || 10);
  const charity = await Charity.findById(req.body.charityId);

  if (
    !["monthly", "yearly"].includes(plan) ||
    !Number.isFinite(contributionPercent) ||
    contributionPercent < 10 ||
    contributionPercent > 100 ||
    !charity
  ) {
    return res.status(400).json({
      error: "Valid plan, charity and contribution 10–100% required",
    });
  }

  const amount = getPlanAmount(plan);
  const order = await razorpay("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: process.env.RAZORPAY_CURRENCY || "USD",
      receipt: `sub_${req.user.id}_${Date.now()}`.slice(0, 40),
      notes: {
        userId: req.user.id,
        plan,
        charityId: String(charity._id),
        contributionPercent: String(contributionPercent),
      },
    }),
  });

  await Payment.create({
    userId: req.user.id,
    type: "subscription",
    amount,
    status: "created",
    orderId: order.id,
    plan,
    charityId: charity._id,
    contributionPercent,
    currency: order.currency,
    note: "Razorpay order created",
  });

  res.status(201).json({
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    plan,
    name: "Digital Heroes",
    description: `${plan === "yearly" ? "Yearly" : "Monthly"} subscription`,
    prefill: {
      name: req.user.name || "",
      email: req.user.email || "",
    },
  });
}

export async function verify(req, res) {
  if (!requireGateway(res)) return;

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: "Incomplete payment verification data" });
  }

  const payment = await Payment.findOne({
    userId: req.user.id,
    orderId,
  });

  if (!payment) {
    return res.status(404).json({ error: "Payment order not found" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  const valid =
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

  if (!valid) {
    payment.status = "failed";
    payment.note = "Invalid Razorpay signature";
    await payment.save();
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  if (payment.status === "paid") {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    return res.json({ subscription, payment });
  }

  const gatewayPayment = await razorpay(`/payments/${paymentId}`);

  if (gatewayPayment.order_id !== orderId) {
    return res.status(400).json({ error: "Payment does not belong to this order" });
  }

  if (gatewayPayment.status === "authorized") {
    await razorpay(`/payments/${paymentId}/capture`, {
      method: "POST",
      body: JSON.stringify({
        amount: gatewayPayment.amount,
        currency: gatewayPayment.currency,
      }),
    });
  } else if (gatewayPayment.status !== "captured") {
    payment.status = "failed";
    payment.note = `Razorpay payment status: ${gatewayPayment.status}`;
    await payment.save();
    return res.status(400).json({ error: "Payment was not captured" });
  }

  payment.paymentId = paymentId;
  payment.signature = signature;
  payment.status = "paid";
  payment.note = "Razorpay payment verified";
  await payment.save();

  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + (payment.plan === "yearly" ? 12 : 1));

  let subscription = await Subscription.findOne({ userId: req.user.id });
  const data = {
    userId: req.user.id,
    plan: payment.plan,
    amount: payment.amount,
    status: "active",
    charityId: payment.charityId,
    contributionPercent: payment.contributionPercent,
    nextRenewal: renewal.toISOString().slice(0, 10),
    cancelledAt: undefined,
    updatedAt: new Date(),
  };

  if (subscription) Object.assign(subscription, data);
  else subscription = new Subscription(data);
  await subscription.save();

  res.json({ subscription, payment });
}

export async function list(req, res) {
  const payments = await Payment.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ payments });
}
