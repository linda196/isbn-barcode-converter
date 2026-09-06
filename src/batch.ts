// Batch conversion for files of mixed ISBN-10/ISBN-13 codes, one per line,
// like you'd get exporting a catalog that was never normalized to one format.
//
// This only operates on strings; reading the file is the caller's job (see
// cli.ts), which keeps the conversion logic itself pure and easy to test.

import { isValidIsbn10, isValidIsbn13, isbn10ToIsbn13, isbn13ToIsbn10, normalize } from "./isbn.js";

export interface BatchLineResult {
  line: number;
  input: string;
  output?: string;
  error?: string;
}

/**
 * Converts every non-blank, non-comment line of `text` to the other ISBN
 * format, preserving 1-based source line numbers so a caller can report
 * failures against the original file. Blank lines and lines starting with
 * "#" are skipped entirely (not included in the result).
 */
export function convertBatch(text: string): BatchLineResult[] {
  const results: BatchLineResult[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (raw === "" || raw.startsWith("#")) continue;

    const lineNumber = i + 1;
    const code = normalize(raw);

    if (isValidIsbn10(code)) {
      results.push({ line: lineNumber, input: raw, output: isbn10ToIsbn13(code) });
      continue;
    }

    if (isValidIsbn13(code)) {
      try {
        results.push({ line: lineNumber, input: raw, output: isbn13ToIsbn10(code) });
      } catch (err) {
        results.push({ line: lineNumber, input: raw, error: (err as Error).message });
      }
      continue;
    }

    results.push({ line: lineNumber, input: raw, error: `not a valid ISBN-10 or ISBN-13: ${raw}` });
  }

  return results;
}
