/**
 * MuzaPay signature payload builder — DRAFT
 *
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/MuzaPay/MuzaPaySignatureBuilder.php
 *
 * Builds the *plaintext* string that is then RSA-signed by MuzaPaySigner.
 * It does NOT sign anything itself.
 *
 * VERIFICATION: this is a pure function — unit-test it against MuzaPay's
 * documented examples once the stack has a test runner. Field ORDER is
 * defined by the gateway and is supplied by the caller; the builder only
 * trims and joins.
 */

export class MuzaPaySignatureBuilder {
  constructor(private readonly delimiter: string = '|') {}

  /**
   * Join values into the signature plaintext.
   *
   * Rules (must match PHP exactly):
   * - values must already be in the gateway-defined order — the builder does
   *   not reorder them;
   * - each value is trimmed;
   * - null / undefined / empty-after-trim values are SKIPPED entirely — they
   *   are not joined as empty segments, so the delimiter does not appear for
   *   them.
   *
   * @param values ordered values, e.g. [correlationId, amount, productCode, ...]
   */
  build(values: ReadonlyArray<string | null | undefined>): string {
    const normalized: string[] = [];
    for (const value of values) {
      if (value === null || value === undefined) {
        continue;
      }
      const trimmed = value.trim();
      if (trimmed === '') {
        continue;
      }
      normalized.push(trimmed);
    }
    return normalized.join(this.delimiter);
  }
}
