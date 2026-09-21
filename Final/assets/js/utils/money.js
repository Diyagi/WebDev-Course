// Rounds a monetary value to two decimal places.
export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
