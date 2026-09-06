#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { isValidIsbn10, isValidIsbn13, isbn10ToIsbn13, isbn13ToIsbn10, normalize } from "./isbn.js";
import { convertBatch } from "./batch.js";

function runBatch(path: string): number {
  const text = readFileSync(path, "utf8");
  const results = convertBatch(text);
  let sawError = false;
  for (const result of results) {
    if (result.error) {
      console.error(`line ${result.line}: ${result.error}`);
      sawError = true;
    } else {
      console.log(result.output);
    }
  }
  return sawError ? 1 : 0;
}

function main(argv: string[]): number {
  const input = argv[0];
  if (!input) {
    console.error("usage: isbn-convert <isbn>");
    console.error("       isbn-convert --file <path>");
    return 1;
  }

  if (input === "--file") {
    const path = argv[1];
    if (!path) {
      console.error("usage: isbn-convert --file <path>");
      return 1;
    }
    return runBatch(path);
  }

  const code = normalize(input);

  if (isValidIsbn10(code)) {
    console.log(isbn10ToIsbn13(code));
    return 0;
  }

  if (isValidIsbn13(code)) {
    try {
      console.log(isbn13ToIsbn10(code));
    } catch (err) {
      console.error((err as Error).message);
      return 1;
    }
    return 0;
  }

  console.error(`not a valid ISBN-10 or ISBN-13: ${input}`);
  return 1;
}

process.exitCode = main(process.argv.slice(2));
