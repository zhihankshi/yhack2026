const { Configuration, Environments, OrdersApi } = require("tremendous");

const DEFAULT_TIER_AMOUNTS = Object.freeze({
  low: 15,
  medium: 30,
  high: 75,
  extreme: 150,
});

function parseTierAmount(key, fallback) {
  const raw = process.env[key];
  if (raw === undefined || raw === null || raw === "") return fallback;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid ${key}. Expected a non-negative number.`);
  }
  return amount;
}

function getTierAmounts() {
  return {
    low: parseTierAmount("GIFT_TIER_AMOUNT_LOW", DEFAULT_TIER_AMOUNTS.low),
    medium: parseTierAmount("GIFT_TIER_AMOUNT_MEDIUM", DEFAULT_TIER_AMOUNTS.medium),
    high: parseTierAmount("GIFT_TIER_AMOUNT_HIGH", DEFAULT_TIER_AMOUNTS.high),
    extreme: parseTierAmount("GIFT_TIER_AMOUNT_EXTREME", DEFAULT_TIER_AMOUNTS.extreme),
  };
}

function mapScoreToReward(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    throw new Error("aiEvaluationScore must be a number");
  }

  if (numericScore <= 0) {
    return { tier: "none", amount: 0, score: numericScore };
  }

  const amounts = getTierAmounts();

  if (numericScore < 20) {
    return { tier: "low", amount: amounts.low, score: numericScore };
  }
  if (numericScore < 50) {
    return { tier: "medium", amount: amounts.medium, score: numericScore };
  }
  if (numericScore < 100) {
    return { tier: "high", amount: amounts.high, score: numericScore };
  }

  return { tier: "extreme", amount: amounts.extreme, score: numericScore };
}

function cleanEnv(key) {
  const value = String(process.env[key] || "").trim();
  return value;
}

function resolveTremendousEnvironment() {
  const env = cleanEnv("TREMENDOUS_ENVIRONMENT");
  if (env) return env;

  const apiUrl = cleanEnv("TREMENDOUS_API_URL");
  if (apiUrl.includes("testflight")) return "testflight";
  if (apiUrl.includes("api.tremendous.com")) return "production";

  return "testflight";
}

function assertTremendousEnv() {
  const required = ["TREMENDOUS_API_KEY", "FUNDING_SOURCE_ID", "CAMPAIGN_ID"];
  const missing = required.filter((key) => !cleanEnv(key));
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
}

async function sendGift({ recipientName, recipientEmail, aiEvaluationScore, externalId, message }) {
  const reward = mapScoreToReward(aiEvaluationScore);
  if (reward.amount === 0) {
    return {
      status: "skipped",
      message: "No gift sent because evaluated score was 0 or below.",
      reward,
    };
  }

  const name = String(recipientName || "").trim();
  const email = String(recipientEmail || "").trim();
  if (!name) throw new Error("recipientName is required");
  if (!email) throw new Error("recipientEmail is required");

  assertTremendousEnv();

  const idempotencyId = String(externalId || `gift-${Date.now()}`).trim();
  const apiUrl = cleanEnv("TREMENDOUS_API_URL") || "https://testflight.tremendous.com";

  try {
    const response = await fetch(`${apiUrl}/api/v2/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanEnv("TREMENDOUS_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment: {
          funding_source_id: cleanEnv("FUNDING_SOURCE_ID"),
        },
        reward: {
          campaign_id: cleanEnv("CAMPAIGN_ID"),
          value: {
            denomination: reward.amount,
            currency_code: "USD"
          },
          delivery: {
            method: "EMAIL",
            ...(message ? { meta: { message: String(message).trim().slice(0, 300) } } : {}),
          },
          recipient: { name, email }
        },
        external_id: idempotencyId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(JSON.stringify(data.errors || data));
    }

    return {
      status: "sent",
      reward,
      external_id: idempotencyId,
      order: data.order,
    };
  } catch (error) {
    console.error("Tremendous API Error:", error?.message || error);
    throw error;
  }
}

module.exports = {
  mapScoreToReward,
  sendGift,
};
