import crypto from "crypto";
import jwt from "jsonwebtoken";
const secret = () =>
  process.env.JWT_SECRET || "digital-heroes-dev-secret-change-me";
export function hashPassword(p) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(p, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(p, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const h = crypto.pbkdf2Sync(p, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}
export const signToken = (u) =>
  jwt.sign(
    {
      id: String(u._id),
      email: u.email,
      role: u.role,
      tokenVersion: Number(u.tokenVersion || 0),
    },
    secret(),
    { expiresIn: "7d" },
  );
export const money = (n) => Math.round(Number(n) * 100) / 100;
export const safeUser = (u) =>
  u
    ? {
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }
    : null;
