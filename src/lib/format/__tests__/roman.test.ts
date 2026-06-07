// toRoman helper (styling-overhaul-7.2) — Roman-numeral conversion for
// editorial episode/act/case numerals. Imported by /episodes index card
// tags and /episodes/[slug] label lines; reusable by future Phase 7
// sections (cases/build-log) that want the same editorial vocabulary.

import { describe, it, expect } from 'vitest';
import { toRoman } from '@/lib/format/roman';

describe('toRoman (styling-overhaul-7.2)', () => {
  // ───────────────────────────────────────────────────────────────
  // Unit — basic singles
  // ───────────────────────────────────────────────────────────────

  it('unit_roman_basic_singles: 1=I, 5=V, 10=X, 50=L, 100=C, 500=D, 1000=M', () => {
    expect(toRoman(1)).toBe('I');
    expect(toRoman(5)).toBe('V');
    expect(toRoman(10)).toBe('X');
    expect(toRoman(50)).toBe('L');
    expect(toRoman(100)).toBe('C');
    expect(toRoman(500)).toBe('D');
    expect(toRoman(1000)).toBe('M');
  });

  // ───────────────────────────────────────────────────────────────
  // Unit — subtractive notation
  // ───────────────────────────────────────────────────────────────

  it('unit_roman_subtractive: 4=IV, 9=IX, 40=XL, 90=XC, 400=CD, 900=CM', () => {
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(9)).toBe('IX');
    expect(toRoman(40)).toBe('XL');
    expect(toRoman(90)).toBe('XC');
    expect(toRoman(400)).toBe('CD');
    expect(toRoman(900)).toBe('CM');
  });

  // ───────────────────────────────────────────────────────────────
  // Unit — composite numerals
  // ───────────────────────────────────────────────────────────────

  it('unit_roman_composite: 3=III, 7=VII, 14=XIV, 39=XXXIX, 1994=MCMXCIV', () => {
    expect(toRoman(3)).toBe('III');
    expect(toRoman(7)).toBe('VII');
    expect(toRoman(14)).toBe('XIV');
    expect(toRoman(39)).toBe('XXXIX');
    expect(toRoman(1994)).toBe('MCMXCIV');
  });

  // ───────────────────────────────────────────────────────────────
  // Unit — defensive / out-of-range
  // ───────────────────────────────────────────────────────────────

  it("unit_roman_zero_returns_empty: toRoman(0) returns '' so callers can chain on missing/zero numerals without crashing", () => {
    expect(toRoman(0)).toBe('');
  });

  it("unit_roman_undefined_returns_empty: toRoman(undefined) returns '' — Episode.act is optional, helper must not crash on missing field", () => {
    expect(toRoman(undefined)).toBe('');
  });

  it("unit_roman_negative_returns_empty: negative numbers return '' (defensive against bad data)", () => {
    expect(toRoman(-1)).toBe('');
    expect(toRoman(-100)).toBe('');
  });

  it("unit_roman_non_integer_returns_empty: non-integer inputs return '' (Roman numerals are integer-only by definition)", () => {
    expect(toRoman(1.5)).toBe('');
    expect(toRoman(99.99)).toBe('');
    expect(toRoman(Number.NaN)).toBe('');
  });

  it('unit_roman_max_valid: toRoman(3999) returns MMMCMXCIX — upper bound of supported range', () => {
    expect(toRoman(3999)).toBe('MMMCMXCIX');
  });

  it("unit_roman_above_range_returns_empty: toRoman(4000) returns '' — beyond the standard 1-3999 range", () => {
    expect(toRoman(4000)).toBe('');
    expect(toRoman(10000)).toBe('');
  });
});
