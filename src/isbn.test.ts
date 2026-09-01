import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeIsbn10CheckDigit,
  computeIsbn13CheckDigit,
  isValidIsbn10,
  isValidIsbn13,
  isbn10ToIsbn13,
  isbn13ToIsbn10,
  formatIsbn13,
  normalize,
} from "./isbn.js";

test("normalize strips hyphens and spaces", () => {
  assert.equal(normalize("0-306-40615-2"), "0306406152");
  assert.equal(normalize("978 0 306 40615 7"), "9780306406157");
});

test("computeIsbn10CheckDigit matches known example", () => {
  // The Feynman Lectures on Physics, ISBN 0-306-40615-2
  assert.equal(computeIsbn10CheckDigit("030640615"), "2");
});

test("computeIsbn10CheckDigit can produce X", () => {
  // 0-8044-2957-X
  assert.equal(computeIsbn10CheckDigit("080442957"), "X");
});

test("computeIsbn13CheckDigit matches known example", () => {
  assert.equal(computeIsbn13CheckDigit("978030640615"), "7");
});

test("isValidIsbn10 accepts a real ISBN and rejects a tampered one", () => {
  assert.equal(isValidIsbn10("0-306-40615-2"), true);
  assert.equal(isValidIsbn10("0-306-40615-3"), false);
});

test("isValidIsbn13 accepts a real ISBN and rejects a tampered one", () => {
  assert.equal(isValidIsbn13("978-0-306-40615-7"), true);
  assert.equal(isValidIsbn13("978-0-306-40615-8"), false);
});

test("isbn10ToIsbn13 round-trips through isbn13ToIsbn10", () => {
  const isbn10 = "0306406152";
  const isbn13 = isbn10ToIsbn13(isbn10);
  assert.equal(isbn13, "9780306406157");
  assert.equal(isbn13ToIsbn10(isbn13), isbn10);
});

test("isbn13ToIsbn10 rejects 979-prefixed codes", () => {
  // 979-8-... has no ISBN-10 form; build a checksum-valid 979 code to test it.
  const first12 = "979800000000";
  const isbn13 = first12 + computeIsbn13CheckDigit(first12);
  assert.throws(() => isbn13ToIsbn10(isbn13), /no ISBN-10 form/);
});

test("isbn10ToIsbn13 rejects an invalid ISBN-10", () => {
  assert.throws(() => isbn10ToIsbn13("0306406153"), /not a valid ISBN-10/);
});

test("formatIsbn13 groups digits with hyphens", () => {
  assert.equal(formatIsbn13("9780306406157"), "978-0-30640615-7");
});
