import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeEan13CheckDigit,
  computeUpcACheckDigit,
  isValidEan13,
  isValidUpcA,
  upcAToEan13,
  ean13ToUpcA,
} from "./barcode.js";

test("computeEan13CheckDigit matches a known barcode", () => {
  // A generic grocery item, EAN-13 4006381333931.
  assert.equal(computeEan13CheckDigit("400638133393"), "1");
});

test("isValidEan13 accepts a real barcode and rejects a tampered one", () => {
  assert.equal(isValidEan13("4006381333931"), true);
  assert.equal(isValidEan13("4006381333932"), false);
});

test("isValidEan13 rejects the wrong length", () => {
  assert.equal(isValidEan13("400638133393"), false);
});

test("computeUpcACheckDigit matches a known barcode", () => {
  // A common UPC-A example, 036000291452.
  assert.equal(computeUpcACheckDigit("03600029145"), "2");
});

test("isValidUpcA accepts a real barcode and rejects a tampered one", () => {
  assert.equal(isValidUpcA("036000291452"), true);
  assert.equal(isValidUpcA("036000291453"), false);
});

test("upcAToEan13 and ean13ToUpcA round-trip", () => {
  const upcA = "036000291452";
  const ean13 = upcAToEan13(upcA);
  assert.equal(ean13, "0036000291452");
  assert.equal(isValidEan13(ean13), true);
  assert.equal(ean13ToUpcA(ean13), upcA);
});

test("ean13ToUpcA rejects codes without a leading 0", () => {
  assert.throws(() => ean13ToUpcA("4006381333931"), /no UPC-A form/);
});

test("upcAToEan13 rejects an invalid UPC-A", () => {
  assert.throws(() => upcAToEan13("036000291453"), /not a valid UPC-A/);
});
