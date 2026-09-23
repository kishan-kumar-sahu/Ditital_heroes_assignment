import mongoose from "mongoose";
const { Schema, model } = mongoose;
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["subscriber", "admin"],
      default: "subscriber",
    },
    tokenVersion: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
const subscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["monthly", "yearly"] },
    amount: Number,
    status: { type: String, enum: ["active", "inactive"] },
    charityId: { type: Schema.Types.ObjectId, ref: "Charity" },
    contributionPercent: { type: Number, min: 10, max: 100 },
    nextRenewal: String,
    cancelledAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
const scoreSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, min: 1, max: 45 },
    date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
scoreSchema.index({ userId: 1, date: 1 }, { unique: true });
const charitySchema = new Schema(
  { name: String, description: String, image: String, featured: Boolean },
  { versionKey: false },
);
const drawSchema = new Schema(
  {
    drawDate: String,
    status: String,
    winningNumbers: [Number],
    mode: String,
    pool: Number,
    tiers: Schema.Types.Mixed,
    eligible: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
const winnerSchema = new Schema(
  {
    drawId: { type: Schema.Types.ObjectId, ref: "Draw" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    matches: Number,
    prize: Number,
    proofUrl: String,
    verification: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    paidAt: Date,
  },
  { versionKey: false },
);
const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: String,
    amount: Number,
    status: String,
    createdAt: { type: Date, default: Date.now },
    note: String,
    orderId: String,
    paymentId: String,
    signature: String,
    plan: { type: String, enum: ["monthly", "yearly"] },
    charityId: { type: Schema.Types.ObjectId, ref: "Charity" },
    contributionPercent: Number,
    currency: { type: String, default: "USD" },
  },
  { versionKey: false },
);
export const User = model("User", userSchema);
export const Subscription = model("Subscription", subscriptionSchema);
export const Score = model("Score", scoreSchema);
export const Charity = model("Charity", charitySchema);
export const Draw = model("Draw", drawSchema);
export const Winner = model("Winner", winnerSchema);
export const Payment = model("Payment", paymentSchema);
