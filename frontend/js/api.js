import { mockCall } from './lib/mock-data.js';

export var MOCK_MODE = true; // 실배포 전 false로 바꾸고 아래 URL을 실제 배포 URL로 교체
export var API_BASE_URL = 'https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec';

function callApi(action, payload) {
  if (MOCK_MODE) return mockCall(action, payload);
  return fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ action: action }, payload))
  }).then(function (res) { return res.json(); });
}

export function syncDown() {
  return callApi('syncDown', {});
}
export function syncUp(items) {
  return callApi('syncUp', { items: items });
}
