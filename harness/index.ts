import { writeFile, mkdir } from "node:fs/promises";
import { loadCases } from "./src/cases";
import { runHarness, printReport } from "./src/harness";

async function main() {
  const cases = loadCases();

  if (cases.length === 0) {
    console.log("No test cases defined. Add cases to src/cases.ts");
    console.log("\nExample:");
    console.log(`
  {
    id: "basic-search",
    name: "Basic index search",
    spl: \`index=main sourcetype=access_combined\`,
    expectedApl: \`['main'] | where sourcetype == "access_combined"\`,
    category: "basic",
  }
`);
    process.exit(1);
  }

  const report = await runHarness(cases, 1);
  printReport(report);

  await mkdir("./results", { recursive: true });
  const outputPath = `./results/${report.timestamp.replace(/:/g, "-")}.json`;
  await writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nResults written to ${outputPath}`);
}

main().catch(console.error);
