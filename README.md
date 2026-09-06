# isbn-barcode-converter

Books have two overlapping identifier formats: the old 10-digit ISBN and
the current 13-digit ISBN, which is also the exact number printed as the
EAN-13 barcode on the cover. Anything that ingests book data from mixed
sources (old catalog exports, new supplier feeds, scanned barcodes) ends
up needing to convert between the two and reject typos, since both formats
carry a check digit that catches single-digit errors and adjacent-digit
transpositions.

This is a small, dependency-free library for that: computing and
validating ISBN-10 and ISBN-13 check digits, and converting between the
two formats.

## Usage

```ts
import { isbn10ToIsbn13, isbn13ToIsbn10, isValidIsbn10, isValidIsbn13 } from "./src/isbn.js";

isValidIsbn10("0-306-40615-2"); // true
isValidIsbn10("0-306-40615-3"); // false, check digit doesn't match

isbn10ToIsbn13("0306406152"); // "9780306406157"
isbn13ToIsbn10("9780306406157"); // "0306406152"

formatIsbn10("0306406152"); // "0-30640615-2"
formatIsbn13("9780306406157"); // "978-0-30640615-7"
```

`formatIsbn10` and `formatIsbn13` add hyphens for display. Neither knows the
real registrant/title boundary (that needs the ISBN range tables, which
aren't included here), so both use a single block for that middle section
instead of guessing at it.

Every exported function is pure: given the same input it always returns
the same output, none of them touch the filesystem or network, and none
of them mutate their arguments. That makes them straightforward to unit
test and safe to call from wherever validation needs to happen (a form
handler, an import pipeline, a CLI).

## Non-book barcodes

An ISBN-13 is an EAN-13 barcode under the Bookland prefix, so the same
check-digit math applies to any other EAN-13 or UPC-A product barcode.
`src/barcode.ts` exposes that directly, without the ISBN-specific rules:

```ts
import { isValidEan13, isValidUpcA, upcAToEan13 } from "./src/barcode.js";

isValidEan13("4006381333931"); // true
isValidUpcA("036000291452"); // true
upcAToEan13("036000291452"); // "0036000291452"
```

## Command line

```
node --experimental-strip-types src/cli.ts 0-306-40615-2
9780306406157

node --experimental-strip-types src/cli.ts 9780306406157
0306406152
```

The CLI detects whether the input is ISBN-10 or ISBN-13 and converts to
the other format. It exits non-zero and prints an error on invalid input.

### Batch conversion

```
node --experimental-strip-types src/cli.ts --file codes.txt
```

Reads one code per line (ISBN-10 or ISBN-13, hyphenated or not), converts
each to the other format, and prints one converted line per input line.
Blank lines and lines starting with `#` are skipped. A line that fails to
convert prints an error to stderr with its source line number and does not
stop the rest of the file from being processed; the command exits non-zero
if any line failed. The line-by-line logic lives in `src/batch.ts` as the
pure function `convertBatch`, independent of file I/O, so it's usable
anywhere a list of codes needs converting, not just from the CLI.

## Why 979 codes don't round-trip

ISBN-13 codes starting with "979" (instead of "978") were introduced
after ISBN-10 was retired, so they have no 10-digit equivalent.
`isbn13ToIsbn10` throws for those; there is nothing sensible to return.

## Status

Early skeleton. Core checksum math, ISBN-10/13 conversion, EAN-13/UPC-A
barcode validation, and batch file conversion are done and tested. See the
roadmap in project notes for what's next.

## Development

No dependencies, so there's nothing to install. Run tests with:

```
npm test
```

which uses Node's built-in test runner against the TypeScript sources
directly.
