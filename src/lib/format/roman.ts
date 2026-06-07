const NUMERAL_MAP: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(n: number | undefined): string {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 3999) {
    return '';
  }
  let value = n;
  let result = '';
  for (const [val, sym] of NUMERAL_MAP) {
    while (value >= val) {
      result += sym;
      value -= val;
    }
  }
  return result;
}
