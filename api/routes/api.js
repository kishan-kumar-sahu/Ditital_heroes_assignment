import { Router } from "express";
import * as auth from "../controllers/authController.js";
import * as charity from "../controllers/charityController.js";
import * as sub from "../controllers/subscriptionController.js";
import * as score from "../controllers/scoreController.js";
import * as draw from "../controllers/drawController.js";
import * as dash from "../controllers/dashboardController.js";
import * as win from "../controllers/winnerController.js";
import * as payment from "../controllers/paymentController.js";
import { auth as protect, roles } from "../middleware/auth.js";
const r = Router();
r.post("/auth/register", auth.register);
r.post("/auth/login", auth.login);
r.get("/auth/me", protect, auth.me);
r.post("/auth/logout", protect, auth.logout);
r.get("/charities", charity.list);
r.get("/charities/:id", charity.one);
r.post("/subscription/demo", protect, sub.subscribe);
r.post("/subscription/cancel", protect, sub.cancel);
r.post("/payments/create-order", protect, payment.createOrder);
r.post("/payments/verify", protect, payment.verify);
r.get(
  "/scores/check-date",
  protect,
  roles(["subscriber", "admin"]),
  score.checkDate,
);
r.get("/scores", protect, roles(["subscriber", "admin"]), score.list);
r.post("/scores", protect, roles(["subscriber", "admin"]), score.create);
r.put("/scores/:id", protect, roles(["subscriber", "admin"]), score.update);
r.delete("/scores/:id", protect, roles(["subscriber", "admin"]), score.remove);
r.get("/draws", protect, draw.list);
r.get("/payments", protect, payment.list);
r.get("/dashboard", protect, roles(["subscriber", "admin"]), dash.dashboard);
r.post(
  "/winners/:id/proof",
  protect,
  roles(["subscriber", "admin"]),
  win.proof,
);
r.post("/admin/draws/simulate", protect, roles(["admin"]), draw.simulation);
r.post("/admin/draws/publish", protect, roles(["admin"]), draw.publish);
r.get("/admin/metrics", protect, roles(["admin"]), dash.metrics);
r.get("/admin/users", protect, roles(["admin"]), dash.users);
r.get("/admin/winners", protect, roles(["admin"]), dash.winners);
r.post("/admin/winners/:id/verify", protect, roles(["admin"]), win.verify);
r.post("/admin/winners/:id/payout", protect, roles(["admin"]), win.payout);
r.post("/admin/charities", protect, roles(["admin"]), charity.create);
r.put("/admin/charities/:id", protect, roles(["admin"]), charity.update);
r.delete("/admin/charities/:id", protect, roles(["admin"]), charity.remove);
export default r;
