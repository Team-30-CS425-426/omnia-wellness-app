import { execSync } from "child_process";

type Counts = Record<string, Record<string, number>>;

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" });
}

function getFiles(): string[] {
  // If files are passed on the command line, use those
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args;
  }

  // Otherwise, use all tracked .ts and .tsx files
  const output = run("git ls-files");
  return output
    .split("\n")
    .filter(
      (f) =>
        (f.endsWith(".ts") || f.endsWith(".tsx")) &&
        !f.endsWith(".d.ts") && // ignore type definition files
        f.trim() !== ""
    );
}

function blameFile(filePath: string, counts: Counts) {
  try {
    const output = run(`git blame --line-porcelain -- "${filePath}"`);
    let currentAuthor: string | null = null;

    for (const line of output.split("\n")) {
      if (line.startsWith("author ")) {
        currentAuthor = line.slice("author ".length).trim();
      } else if (line.startsWith("\t")) {
        // This is a source line belonging to currentAuthor
        if (!currentAuthor) continue;

        if (!counts[currentAuthor]) {
          counts[currentAuthor] = {};
        }
        if (!counts[currentAuthor][filePath]) {
          counts[currentAuthor][filePath] = 0;
        }
        counts[currentAuthor][filePath] += 1;
      }
    }
  } catch (err) {
    console.error(`Skipping ${filePath} (git blame failed)`);
  }
}

function main() {
  let files = getFiles();
  if (files.length === 0) {
    console.log("No files to process.");
    return;
  }

  const counts: Counts = {};

  for (const f of files) {
    blameFile(f, counts);
  }

  const authors = Object.keys(counts).sort();
  if (authors.length === 0) {
    console.log("No blame data found.");
    return;
  }

  for (const author of authors) {
    console.log(author);
    const fileMap = counts[author];

    // For pretty alignment
    const entries = Object.entries(fileMap).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    const maxFileLen = entries.reduce(
      (max, [file]) => Math.max(max, file.length),
      0
    );

    let total = 0;
    for (const [file, nLines] of entries) {
      total += nLines;
      const paddedFile = file.padEnd(maxFileLen + 2, " ");
      console.log(`  ${paddedFile}${nLines}`);
    }
    console.log(`  Total: ${total}\n`);
  }
}

main();
