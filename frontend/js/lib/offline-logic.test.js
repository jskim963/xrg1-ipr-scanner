import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOfflineInquiryResult, buildSyncQueueItem, summarizeSyncResults } from './offline-logic.js';

test('buildOfflineInquiryResult: 큐에 이미 있는 건은 오프라인 처리됨으로 표시한다', () => {
  const queued = [{ iprBarcode: 'IPR0001' }];
  const result = buildOfflineInquiryResult([], queued, 'IPR0001');
  assert.equal(result.found, true);
  assert.equal(result.alreadyProcessed, true);
  assert.equal(result.offline, true);
  assert.equal(result.existingStatus, '오프라인 처리됨(동기화 대기 중)');
});

test('buildOfflineInquiryResult: 스냅샷에 있으면 필드를 그대로 반환한다', () => {
  const snapshot = [{ iprBarcode: 'IPR0002', productName: '테스트 상품', vendor: '벤더', qty: 1, method: '택배' }];
  const result = buildOfflineInquiryResult(snapshot, [], 'IPR0002');
  assert.equal(result.found, true);
  assert.equal(result.duplicate, false);
  assert.equal(result.alreadyProcessed, false);
  assert.equal(result.productName, '테스트 상품');
  assert.equal(result.offline, true);
});

test('buildOfflineInquiryResult: 큐/스냅샷 둘 다 없으면 offlineUnknown', () => {
  const result = buildOfflineInquiryResult([], [], 'IPR9999');
  assert.equal(result.found, false);
  assert.equal(result.offlineUnknown, true);
});

test('buildOfflineInquiryResult: 큐가 스냅샷보다 우선한다', () => {
  const snapshot = [{ iprBarcode: 'IPR0003', productName: '원본' }];
  const queued = [{ iprBarcode: 'IPR0003' }];
  const result = buildOfflineInquiryResult(snapshot, queued, 'IPR0003');
  assert.equal(result.alreadyProcessed, true);
});

test('buildSyncQueueItem: 액션/필드를 그대로 담고 시각을 ISO 문자열로 저장한다', () => {
  const now = new Date('2026-08-27T09:00:00.000Z');
  const worker = { name: '홍길동', vfId: 'VF1' };
  const item = buildSyncQueueItem('processDiscard', { iprBarcode: 'IPR0001', worker, photoBase64: 'data:x', now });
  assert.deepEqual(item, {
    action: 'processDiscard',
    iprBarcode: 'IPR0001',
    worker,
    photoBase64: 'data:x',
    trackingNo: null,
    offlineTimestamp: '2026-08-27T09:00:00.000Z'
  });
});

test('buildSyncQueueItem: photoBase64/trackingNo가 없으면 null로 채운다', () => {
  const now = new Date('2026-08-27T09:00:00.000Z');
  const item = buildSyncQueueItem('processReturnVendor', { iprBarcode: 'IPR0002', worker: { name: 'a', vfId: 'b' }, now });
  assert.equal(item.photoBase64, null);
  assert.equal(item.trackingNo, null);
});

test('summarizeSyncResults: 상태별 개수를 센다', () => {
  const results = [
    { iprBarcode: 'A', status: 'applied' },
    { iprBarcode: 'B', status: 'applied' },
    { iprBarcode: 'C', status: 'duplicate' },
    { iprBarcode: 'D', status: 'not_found' },
    { iprBarcode: 'E', status: 'error' }
  ];
  assert.deepEqual(summarizeSyncResults(results), { appliedCount: 2, duplicateCount: 1, notFoundCount: 1, errorCount: 1 });
});

test('summarizeSyncResults: 빈 배열은 전부 0', () => {
  assert.deepEqual(summarizeSyncResults([]), { appliedCount: 0, duplicateCount: 0, notFoundCount: 0, errorCount: 0 });
});
