import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getModelConfigSummary } from "./config.js";
import { RunAgentResponseSchema } from "./runAgentContract.js";
import { runAlibiAgent } from "./runAlibiAgent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = join(__dirname, "__snapshots__");

/** Slugged cases: includes `anniversary` + `coworker-birthday` for regression baselines. */
const TEST_CASES: { slug: string; input: string }[] = [
  { slug: "anniversary", input: "I forgot my partner's anniversary." },
  {
    slug: "coworker-birthday",
    input:
      "Forgot my coworker Sam's birthday; I need a small appropriate gift idea.",
  },
  { slug: "manager-meeting", input: "I missed a meeting with my manager." },
  {
    slug: "anniversary-dinner",
    input:
      "Forgot our anniversary dinner reservation; partner was upset and went home early.",
  },
  {
    slug: "family-joke",
    input:
      "Made a joke about their family at a party; they have not texted in two days.",
  },
  { slug: "move-bailed", input: "Promised to help move apartments but bailed last minute citing work." },
];

function printRuntimeModelConfig() {
  const c = getModelConfigSummary();
  console.log("LLM config (from env / defaults):");
  console.log(`  DEMO_MODE: ${c.demoMode}`);
  console.log(
    `  MODEL_FAST (research, reason): ${c.modelFast} | max_tokens: ${c.maxTokensResearch} / ${c.maxTokensReason}`
  );
  console.log(
    `  MODEL_WRITE: ${c.modelWrite} | max_tokens: ${c.maxTokensWrite}`
  );
  console.log(`  TEMPERATURE (all steps): ${c.temperature}`);
}

function writeSnapshot(slug: string, data: unknown) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const path = join(SNAPSHOT_DIR, `${slug}.json`);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`snapshot written: ${path}`);
}

async function main() {
  printRuntimeModelConfig();

  for (let i = 0; i < TEST_CASES.length; i++) {
    const { slug, input } = TEST_CASES[i];
    console.log("\n" + "=".repeat(60));
    console.log(`Test ${i + 1}/${TEST_CASES.length} [${slug}]`);
    console.log("Input:", input);
    console.log("-".repeat(60));

    const out = await runAlibiAgent(input);
    RunAgentResponseSchema.parse(out);

    console.log(
      `telemetry: usedFallback=${out.debug.usedFallback} pausedForUserInput=${out.debug.pausedForUserInput} status=${out.status} incidentType=${out.reasoning.incidentType}`
    );

    writeSnapshot(slug, out);

    const json = JSON.stringify(out, null, 2);
    console.log("--- final JSON ---");
    console.log(json);

    RunAgentResponseSchema.parse(JSON.parse(json));
    console.log("RunAgentResponseSchema.parse: OK (object + round-trip)");
  }

  console.log(
    "\nAll cases: RunAgentResponseSchema.parse succeeded. Compare ./agent/__snapshots__/*.json after refactors."
  );
}

main();
