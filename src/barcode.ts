// EAN-13 and UPC-A barcode checksum validation, for products that aren't
// books (an ISBN-13 is just an EAN-13 under the Bookland "978"/"979"
// prefix, so the digit math here is what src/isbn.ts's ISBN-13 support
// is actually built on).

export type Ean13 = string;
export type UpcA = string;

/** Strips spaces and hyphens some barcodes are printed or entered with. */
function normalizeDigits(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/**
 * Computes the EAN-13 check digit for the first 12 digits: alternating
 * weights of 1 and 3 (starting with 1), mod 10.
 */
export function computeEan13CheckDigit(first12Digits: string): string {
  if (!/^\d{12}$/.test(first12Digits)) {
    throw new RangeError("expected exactly 12 digits");
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += weight * Number(first12Digits[i]);
  }
  const remainder = (10 - (sum % 10)) % 10;
  return String(remainder);
}

/** True if `input` is a syntactically and checksum-valid EAN-13 barcode. */
export function isValidEan13(input: string): boolean {
  const code = normalizeDigits(input);
  if (!/^\d{13}$/.test(code)) return false;
  return computeEan13CheckDigit(code.slice(0, 12)) === code[12];
}

/**
 * Computes the UPC-A check digit for the first 11 digits: alternating
 * weights of 3 and 1 (starting with 3), mod 10.
 *
 * A UPC-A code is what an EAN-13 code becomes when its leading digit is
 * 0: dropping that leading 0 shifts every weight by one position, which
 * is why UPC-A starts its weight cycle at 3 instead of 1.
 */
export function computeUpcACheckDigit(first11Digits: string): string {
  if (!/^\d{11}$/.test(first11Digits)) {
    throw new RangeError("expected exactly 11 digits");
  }
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const weight = i % 2 === 0 ? 3 : 1;
    sum += weight * Number(first11Digits[i]);
  }
  const remainder = (10 - (sum % 10)) % 10;
  return String(remainder);
}

/** True if `input` is a syntactically and checksum-valid UPC-A barcode. */
export function isValidUpcA(input: string): boolean {
  const code = normalizeDigits(input);
  if (!/^\d{12}$/.test(code)) return false;
  return computeUpcACheckDigit(code.slice(0, 11)) === code[11];
}

/** Converts a valid UPC-A barcode to its EAN-13 form by prepending "0". */
export function upcAToEan13(input: UpcA): Ean13 {
  const code = normalizeDigits(input);
  if (!isValidUpcA(code)) {
    throw new RangeError(`not a valid UPC-A: ${input}`);
  }
  return "0" + code;
}

/**
 * Converts a valid EAN-13 barcode to UPC-A by dropping the leading "0".
 * Only codes with that leading 0 have a UPC-A form.
 */
export function ean13ToUpcA(input: Ean13): UpcA {
  const code = normalizeDigits(input);
  if (!isValidEan13(code)) {
    throw new RangeError(`not a valid EAN-13: ${input}`);
  }
  if (!code.startsWith("0")) {
    throw new RangeError(`EAN-13 has no UPC-A form (does not start with 0): ${input}`);
  }
  return code.slice(1);
}
