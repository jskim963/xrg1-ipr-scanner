export function normalizeScanValue(rawValue) {
  var trimmed = String(rawValue == null ? '' : rawValue).trim();
  return trimmed === '' ? null : trimmed;
}
