import { runRepairAgent } from "./orchestrator.js";
import type { RepairState } from "./state.js";

const TEST_INPUTS = [
  "I forgot my partner's anniversary.",
  "I missed a meeting with my manager.",
  "Forgot our anniversary dinner reservation; partner was upset and went home early.",
  "Made a joke about their family at a party; they have not texted in two days.",
  "Promised to help move apartments but bailed last minute citing work.",
];

function printResult(state: RepairState, pipelineOk: boolean) {
  const r = state.reasoning;
  const gifts = state.research?.giftIdeas ?? [];

  if (r) {
    console.log(
      `incidentType: ${r.incidentType} | alibiPolicy: ${r.alibiPolicy}`
    );
    console.log(
      `severity: ${r.severity} | tone: ${r.tone} | budget: [${r.budgetRange[0]}, ${r.budgetRange[1]}]`
    );
  } else {
    console.log("severity/tone/budget: (missing reasoning)");
  }

  console.log("Top 3 gift ideas (title + searchQuery):");
  for (const g of gifts.slice(0, 3)) {
    console.log(`  - ${g.title} | ${g.searchQuery}`);
  }
  if (gifts.length === 0) console.log("  (none)");

  const w = state.writing;
  if (w) {
    console.log("Apology:\n" + w.apologyMessage);
    console.log("Follow-up:\n" + w.followUpMessage);
  } else {
    console.log("Apology / follow-up: (missing writing)");
  }

  console.log(`pipeline ok (no fallbacks): ${pipelineOk}`);
}

async function main() {
  for (let i = 0; i < TEST_INPUTS.length; i++) {
    const input = TEST_INPUTS[i];
    console.log("\n" + "=".repeat(60));
    console.log(`Test ${i + 1}/${TEST_INPUTS.length}`);
    console.log("Input:", input);
    console.log("-".repeat(60));

    const { state, ok } = await runRepairAgent(input);
    printResult(state, ok);
  }
}

main();
