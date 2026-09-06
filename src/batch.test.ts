import { test } from "node:test";
import assert from "node:assert/strict";
import { convertBatch } from "./batch.js";

test("convertBatch converts ISBN-10 and ISBN-13 lines to the other format", () => {
  const results = convertBatch("0-306-40615-2\n9780306406157\n");
  assert.equal(results.length, 2);
  assert.equal(results[0].output, "9780306406157");
  assert.equal(results[1].output, "0306406152");
});

test("convertBatch reports the source line number for each entry", () => {
  const results = convertBatch("0-306-40615-2\n\n9780306406157\n");
  assert.deepEqual(
    results.map((r) => r.line),
    [1, 3],
  );
});

test("convertBatch skips blank lines and comments", () => {
  const results = convertBatch("# catalog export\n0-306-40615-2\n\n  \n9780306406157\n");
  assert.equal(results.length, 2);
});

test("convertBatch records an error for a garbled line without stopping", () => {
  const results = convertBatch("0-306-40615-2\nnot-an-isbn\n9780306406157\n");
  assert.equal(results.length, 3);
  assert.equal(results[0].output, "9780306406157");
  assert.equal(results[1].error, "not a valid ISBN-10 or ISBN-13: not-an-isbn");
  assert.equal(results[2].output, "0306406152");
});

test("convertBatch records an error for a 979-prefixed ISBN-13", () => {
  // 979-8-00000-000-7 is checksum-valid but has no ISBN-10 form.
  const results = convertBatch("979-8-00000-000-7\n");
  assert.equal(results.length, 1);
  assert.match(results[0].error ?? "", /no ISBN-10 form/);
});
