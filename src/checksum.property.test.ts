// Property tests for the checksum math: instead of checking a handful of
// known codes, generate many random ones and check invariants that should
// hold for *any* input, e.g. "a freshly computed check digit always
// validates" and "changing exactly one digit always invalidates the code".
// The PRNG is seeded so a failure is reproducible without needing to log
// the random inputs separately.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeIsbn10CheckDigit,
  computeIsbn13CheckDigit,
  isValidIsbn10,
  isValidIsbn13,
  isbn10ToIsbn13,
  isbn13ToIsbn10,
} from "./isbn.js";
import { computeEan13CheckDigit, computeUpcACheckDigit, isValidEan13, isValidUpcA } from "./barcode.js";

/** Deterministic PRNG (mulberry32) so failures are reproducible across runs. */
function makeRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomDigits(rng: () => number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(rng() * 10);
  }
  return out;
}

const TRIALS = 500;

test("computeIsbn10CheckDigit: appending it always yields a valid ISBN-10", () => {
  const rng = makeRng(1);
  for (let i = 0; i < TRIALS; i++) {
    const first9 = randomDigits(rng, 9);
    const code = first9 + computeIsbn10CheckDigit(first9);
    assert.equal(isValidIsbn10(code), true, `expected ${code} to validate`);
  }
});

test("computeIsbn13CheckDigit: appending it always yields a valid ISBN-13", () => {
  const rng = makeRng(2);
  for (let i = 0; i < TRIALS; i++) {
    const first12 = randomDigits(rng, 12);
    const code = first12 + computeIsbn13CheckDigit(first12);
    assert.equal(isValidIsbn13(code), true, `expected ${code} to validate`);
  }
});

test("computeEan13CheckDigit: appending it always yields a valid EAN-13", () => {
  const rng = makeRng(3);
  for (let i = 0; i < TRIALS; i++) {
    const first12 = randomDigits(rng, 12);
    const code = first12 + computeEan13CheckDigit(first12);
    assert.equal(isValidEan13(code), true, `expected ${code} to validate`);
  }
});

test("computeUpcACheckDigit: appending it always yields a valid UPC-A", () => {
  const rng = makeRng(4);
  for (let i = 0; i < TRIALS; i++) {
    const first11 = randomDigits(rng, 11);
    const code = first11 + computeUpcACheckDigit(first11);
    assert.equal(isValidUpcA(code), true, `expected ${code} to validate`);
  }
});

test("ISBN-10 checksum catches every single-digit substitution", () => {
  const rng = makeRng(5);
  for (let i = 0; i < TRIALS; i++) {
    const first9 = randomDigits(rng, 9);
    const code = first9 + computeIsbn10CheckDigit(first9);
    const position = Math.floor(rng() * 10);
    const original = code[position];
    let replacement = String(Math.floor(rng() * 10));
    if (replacement === original) replacement = original === "9" ? "0" : String(Number(original) + 1);
    const tampered = code.slice(0, position) + replacement + code.slice(position + 1);
    assert.equal(isValidIsbn10(tampered), false, `expected ${tampered} (from ${code}) to be invalid`);
  }
});

test("EAN-13/ISBN-13 checksum catches every single-digit substitution", () => {
  const rng = makeRng(6);
  for (let i = 0; i < TRIALS; i++) {
    const first12 = randomDigits(rng, 12);
    const code = first12 + computeEan13CheckDigit(first12);
    const position = Math.floor(rng() * 13);
    const original = code[position];
    let replacement = String(Math.floor(rng() * 10));
    if (replacement === original) replacement = original === "9" ? "0" : String(Number(original) + 1);
    const tampered = code.slice(0, position) + replacement + code.slice(position + 1);
    assert.equal(isValidEan13(tampered), false, `expected ${tampered} (from ${code}) to be invalid`);
  }
});

test("ISBN-10 checksum catches every adjacent-digit transposition", () => {
  // Unlike the EAN-13/ISBN-13 scheme, ISBN-10's descending 10..1 weights
  // mean any two adjacent positions differ in weight by exactly 1, so
  // swapping two different digits always changes the checksum.
  const rng = makeRng(7);
  let trials = 0;
  while (trials < TRIALS) {
    const first9 = randomDigits(rng, 9);
    const position = Math.floor(rng() * 8); // swap position and position+1, both within the first 9 digits
    if (first9[position] === first9[position + 1]) continue; // a no-op swap is still valid, so skip it
    const code = first9 + computeIsbn10CheckDigit(first9);
    const chars = code.split("");
    [chars[position], chars[position + 1]] = [chars[position + 1], chars[position]];
    assert.equal(isValidIsbn10(chars.join("")), false, `expected transposed ${chars.join("")} to be invalid`);
    trials++;
  }
});

test("isbn10ToIsbn13 followed by isbn13ToIsbn10 round-trips for random valid ISBN-10s", () => {
  const rng = makeRng(8);
  for (let i = 0; i < TRIALS; i++) {
    const first9 = randomDigits(rng, 9);
    const isbn10 = first9 + computeIsbn10CheckDigit(first9);
    const isbn13 = isbn10ToIsbn13(isbn10);
    assert.equal(isbn13ToIsbn10(isbn13), isbn10);
  }
});
