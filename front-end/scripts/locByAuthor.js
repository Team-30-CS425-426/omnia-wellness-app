"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
function run(cmd) {
    return (0, child_process_1.execSync)(cmd, { encoding: "utf8" });
}
function getFiles() {
    // If files are passed on the command line, use those
    var args = process.argv.slice(2);
    if (args.length > 0) {
        return args;
    }
    // Otherwise, use all tracked .ts and .tsx files
    var output = run("git ls-files");
    return output
        .split("\n")
        .filter(function (f) {
        return (f.endsWith(".ts") || f.endsWith(".tsx")) &&
            !f.endsWith(".d.ts") && // ignore type definition files
            f.trim() !== "";
    });
}
function blameFile(filePath, counts) {
    try {
        var output = run("git blame --line-porcelain -- \"".concat(filePath, "\""));
        var currentAuthor = null;
        for (var _i = 0, _a = output.split("\n"); _i < _a.length; _i++) {
            var line = _a[_i];
            if (line.startsWith("author ")) {
                currentAuthor = line.slice("author ".length).trim();
            }
            else if (line.startsWith("\t")) {
                // This is the actual source line text
                if (!currentAuthor)
                    continue;
                var content = line.slice(1); // remove the leading tab
                var trimmed = content.trim();
                // 1) Skip completely empty lines
                if (trimmed === "") {
                    continue;
                }
                // 2) Skip obvious comment-only lines
                if (trimmed.startsWith("//") || // single-line comment
                    trimmed.startsWith("/*") || // start of block comment
                    trimmed.startsWith("*") || // inside block comment
                    trimmed.startsWith("*/") // end of block comment
                ) {
                    continue;
                }
                if (!counts[currentAuthor]) {
                    counts[currentAuthor] = {};
                }
                if (!counts[currentAuthor][filePath]) {
                    counts[currentAuthor][filePath] = 0;
                }
                counts[currentAuthor][filePath] += 1;
            }
        }
    }
    catch (err) {
        console.error("Skipping ".concat(filePath, " (git blame failed)"));
    }
}
function main() {
    var files = getFiles();
    if (files.length === 0) {
        console.log("No files to process.");
        return;
    }
    var counts = {};
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var f = files_1[_i];
        blameFile(f, counts);
    }
    var authors = Object.keys(counts).sort();
    if (authors.length === 0) {
        console.log("No blame data found.");
        return;
    }
    for (var _a = 0, authors_1 = authors; _a < authors_1.length; _a++) {
        var author = authors_1[_a];
        console.log(author);
        var fileMap = counts[author];
        var entries = Object.entries(fileMap).sort(function (_a, _b) {
            var a = _a[0];
            var b = _b[0];
            return a.localeCompare(b);
        });
        // For pretty alignment of filenames
        var maxFileLen = entries.reduce(function (max, _a) {
            var file = _a[0];
            return Math.max(max, file.length);
        }, 0);
        var total = 0;
        for (var _b = 0, entries_1 = entries; _b < entries_1.length; _b++) {
            var _c = entries_1[_b], file = _c[0], nLines = _c[1];
            total += nLines;
            var paddedFile = file.padEnd(maxFileLen + 2, " ");
            console.log("  ".concat(paddedFile).concat(nLines));
        }
        console.log("  Total: ".concat(total, "\n"));
    }
}
main();
