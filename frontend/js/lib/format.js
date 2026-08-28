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

export function formatRelativeMinutes(isoString, nowMs) {
  if (!isoString) return null;
  var now = nowMs == null ? Date.now() : nowMs;
  var diffMs = now - new Date(isoString).getTime();
  var minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return minutes + '분 전';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + '시간 전';
  var days = Math.floor(hours / 24);
  return days + '일 전';
}
