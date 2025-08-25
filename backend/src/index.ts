import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

const ScoreSchema = z.object({
  monthly_income: z.number().nonnegative(),
  expenses_ratio: z.number().min(0).max(1), // fraction of income
  tx_count_90d: z.number().nonnegative(),
  onchain_age_days: z.number().nonnegative(),
  avg_tx_amount: z.number().nonnegative(),
  country_risk: z.number().min(0).max(1).default(0.2),
  existing_debt: z.number().nonnegative().default(0),
});

app.post("/score", (req, res) => {
  const parsed = ScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const d = parsed.data;

  // Heuristic scoring (0..100)
  let score = 50;

  // Income vs expenses
  const disposable = d.monthly_income * (1 - d.expenses_ratio) - d.existing_debt * 0.05;
  if (disposable > 500) score += 15;
  else if (disposable > 200) score += 8;
  else if (disposable < 50) score -= 10;

  // On-chain behavior
  if (d.onchain_age_days > 180) score += 10;
  else if (d.onchain_age_days < 14) score -= 10;

  if (d.tx_count_90d > 50) score += 10;
  else if (d.tx_count_90d < 3) score -= 8;

  if (d.avg_tx_amount > 200) score += 5;

  // Country risk (lower is better)
  score += Math.round((1 - d.country_risk) * 10) - 5;

  score = Math.max(0, Math.min(100, score));

  const recommendation =
    score >= 75 ? "approve"
      : score >= 55 ? "review"
      : "reject";

  return res.json({ score, recommendation });
});

const FraudSchema = z.object({
  ip_country: z.string(),
  device_changes_30d: z.number().nonnegative(),
  velocity_last_24h: z.number().nonnegative(), // number of transactions
  failed_auth_7d: z.number().nonnegative(),
  blacklist_hit: z.boolean().default(false),
});

app.post("/fraud", (req, res) => {
  const parsed = FraudSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const d = parsed.data;

  let risk = 20;
  if (d.blacklist_hit) risk += 60;
  if (d.device_changes_30d > 3) risk += 10;
  if (d.velocity_last_24h > 20) risk += 10;
  if (d.failed_auth_7d > 5) risk += 10;

  risk = Math.max(0, Math.min(100, risk));
  const flags: string[] = [];
  if (d.blacklist_hit) flags.push("blacklist_match");
  if (d.device_changes_30d > 3) flags.push("device_velocity_high");
  if (d.velocity_last_24h > 20) flags.push("tx_velocity_high");
  if (d.failed_auth_7d > 5) flags.push("failed_auth_spike");

  return res.json({ risk, flags });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`StellAI backend listening on http://localhost:${PORT}`);
});
