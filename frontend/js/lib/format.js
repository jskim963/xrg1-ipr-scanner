export function formatDateDisplay(value) {
  if (!value) return '-';
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  var str = String(value);
  var match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str;
}

export function formatDPlus6Badge(rawValue) {
  var value = String(rawValue || '').trim();
  return value === '' ? '미초과' : '초과';
}

export function formatMethodLabel(method) {
  var value = String(method || '').trim();
  if (value.indexOf('택배') !== -1) return '택배';
  if (value.indexOf('업체') !== -1) return '업체직접회수';
  return value || '미지정';
}

export function splitBarcodeSuffix(barcode, suffixLength) {
  var str = String(barcode == null ? '' : barcode);
  var len = suffixLength || 4;
  if (str.length <= len) {
    return { prefix: '', suffix: str };
  }
  return { prefix: str.slice(0, str.length - len), suffix: str.slice(str.length - len) };
}
