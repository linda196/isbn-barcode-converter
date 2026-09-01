#!/usr/bin/env node
import { isValidIsbn10, isValidIsbn13, isbn10ToIsbn13, isbn13ToIsbn10, normalize } from "./isbn.js";

function main(argv: string[]): number {
  const input = argv[0];
  if (!input) {
    console.error("usage: isbn-convert <isbn>");
    return 1;
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
