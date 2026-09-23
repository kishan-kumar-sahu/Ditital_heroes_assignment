import { Winner, Payment } from "../models/index.js";
export async function proof(req, res) {
  const w = await Winner.findOne({ _id: req.params.id, userId: req.user.id });
  if (!w) return res.status(404).json({ error: "Winner not found" });
  w.proofUrl = String(req.body.proofUrl || "");
  w.verification = "pending";
  await w.save();
  res.json({ winner: w });
}
export async function verify(req, res) {
  const w = await Winner.findById(req.params.id);
  if (!w) return res.status(404).json({ error: "Winner not found" });
  w.verification = req.body.approved ? "approved" : "rejected";
  w.reviewedAt = new Date();
  await w.save();
  res.json({ winner: w });
}
export async function payout(req, res) {
  const w = await Winner.findById(req.params.id);
  if (!w) return res.status(404).json({ error: "Winner not found" });
  if (w.verification !== "approved")
    return res.status(400).json({ error: "Winner must be approved first" });
  w.payoutStatus = "paid";
  w.paidAt = new Date();
  await w.save();
  await Payment.create({
    userId: w.userId,
    type: "prize",
    amount: w.prize,
    status: "paid",
  });
  res.json({ winner: w });
}
