// ISBN-10 <-> ISBN-13 conversion and checksum validation.
//
// ISBN-13 uses the same check-digit algorithm as EAN-13/UPC barcodes
// (alternating weights of 1 and 3, mod 10), because ISBN-13 codes are
// literally the numbers printed as the barcode on the back of the book,
// under the "978" or "979" Bookland prefix. ISBN-10 predates that and
// uses its own mod-11 scheme with 'X' standing in for the digit 10.

import { computeEan13CheckDigit } from "./barcode.js";

export type Isbn10 = string;
export type Isbn13 = string;

/** Strips spaces and hyphens, leaving only digits and a possible trailing 'X'. */
export function normalize(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Computes the ISBN-10 check digit for the first 9 digits.
 * Returns '0'-'9' or 'X'.
 */
export function computeIsbn10CheckDigit(first9Digits: string): string {
  if (!/^\d{9}$/.test(first9Digits)) {
    throw new RangeError("expected exactly 9 digits");
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (10 - i) * Number(first9Digits[i]);
  }
  const remainder = (11 - (sum % 11)) % 11;
  return remainder === 10 ? "X" : String(remainder);
}

/**
 * Computes the ISBN-13 check digit for the first 12 digits. Returns a
 * single digit '0'-'9'. This is the EAN-13 checksum algorithm; see
 * src/barcode.ts for the non-book barcode case.
 */
export function computeIsbn13CheckDigit(first12Digits: string): string {
  return computeEan13CheckDigit(first12Digits);
}

/** True if `input` is a syntactically and checksum-valid ISBN-10. */
export function isValidIsbn10(input: string): boolean {
  const code = normalize(input);
  if (!/^\d{9}[\dX]$/.test(code)) return false;
  return computeIsbn10CheckDigit(code.slice(0, 9)) === code[9];
}

/** True if `input` is a syntactically and checksum-valid ISBN-13. */
export function isValidIsbn13(input: string): boolean {
  const code = normalize(input);
  if (!/^\d{13}$/.test(code)) return false;
  return computeIsbn13CheckDigit(code.slice(0, 12)) === code[12];
}

/**
 * Converts a valid ISBN-10 to its ISBN-13 equivalent by prepending the
 * "978" Bookland prefix and recomputing the check digit.
 */
export function isbn10ToIsbn13(input: Isbn10): Isbn13 {
  const code = normalize(input);
  if (!isValidIsbn10(code)) {
    throw new RangeError(`not a valid ISBN-10: ${input}`);
  }
  const first12 = "978" + code.slice(0, 9);
  return first12 + computeIsbn13CheckDigit(first12);
}

/**
 * Converts a valid ISBN-13 back to ISBN-10. Only codes under the "978"
 * prefix have an ISBN-10 form; "979" titles were assigned after ISBN-10
 * was retired and cannot be converted.
 */
export function isbn13ToIsbn10(input: Isbn13): Isbn10 {
  const code = normalize(input);
  if (!isValidIsbn13(code)) {
    throw new RangeError(`not a valid ISBN-13: ${input}`);
  }
  if (!code.startsWith("978")) {
    throw new RangeError(`ISBN-13 has no ISBN-10 form (prefix is not 978): ${input}`);
  }
  const first9 = code.slice(3, 12);
  return first9 + computeIsbn10CheckDigit(first9);
}

/**
 * Groups a normalized ISBN-13 as prefix-group-registrant/title-check, e.g.
 * "978-0-30640615-7". The real registrant/publisher/title split needs the
 * ISBN range tables and isn't derivable from the digits alone, so this uses
 * a single block for that middle section.
 */
export function formatIsbn13(input: Isbn13): string {
  const code = normalize(input);
  if (!/^\d{13}$/.test(code)) {
    throw new RangeError(`not 13 digits: ${input}`);
  }
  return [code.slice(0, 3), code.slice(3, 4), code.slice(4, 12), code.slice(12)].join("-");
}
