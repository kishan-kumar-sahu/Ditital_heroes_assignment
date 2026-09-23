import { Subscription } from "../models/index.js";

export async function subscribe(req, res) {
  return res.status(410).json({
    error: "Demo subscription checkout has been removed. Use the payment checkout flow.",
  });
}

export async function cancel(req, res) {
  const s = await Subscription.findOne({ userId: req.user.id });
  if (!s) return res.status(404).json({ error: "No subscription" });
  s.status = "inactive";
  s.cancelledAt = new Date();
  s.updatedAt = new Date();
  await s.save();
  res.json({ subscription: s });
}
