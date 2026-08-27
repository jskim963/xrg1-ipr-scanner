import * as api from './api.js';
import * as db from './lib/offline-db.js';
import { buildOfflineInquiryResult, buildSyncQueueItem, summarizeSyncResults } from './lib/offline-logic.js';

export function downloadSnapshot() {
  return api.syncDown().then(function (res) {
    if (!res.success) throw new Error('스냅샷 다운로드 실패');
    return db.saveSnapshot(res.items);
  });
}

export function inquiry(iprBarcode) {
  return api.inquiry(iprBarcode).catch(function (err) {
    console.warn('온라인 조회 실패 - 오프라인 데이터로 대체:', err);
    return Promise.all([db.getSnapshot(), db.getQueueItems()]).then(function (results) {
      return buildOfflineInquiryResult(results[0], results[1], iprBarcode);
    });
  });
}

function queueAndSucceed_(action, params) {
  var item = buildSyncQueueItem(action, Object.assign({ now: new Date() }, params));
  return db.addQueueItem(item).then(function () {
    return { success: true, offline: true };
  }).catch(function (err) {
    console.warn('오프라인 큐 저장 실패:', err);
    return { success: false, error: 'OFFLINE_QUEUE_FAILED' };
  });
}

export function processDiscard(iprBarcode, worker, photoBase64) {
  return api.processDiscard(iprBarcode, worker, photoBase64).catch(function (err) {
    console.warn('온라인 폐기 처리 실패 - 오프라인 큐에 저장:', err);
    return queueAndSucceed_('processDiscard', { iprBarcode: iprBarcode, worker: worker, photoBase64: photoBase64 });
  });
}

export function processReturnVendor(iprBarcode, worker) {
  return api.processReturnVendor(iprBarcode, worker).catch(function (err) {
    console.warn('온라인 업체회송 처리 실패 - 오프라인 큐에 저장:', err);
    return queueAndSucceed_('processReturnVendor', { iprBarcode: iprBarcode, worker: worker });
  });
}

export function processReturnParcel(iprBarcode, trackingNo, worker) {
  return api.processReturnParcel(iprBarcode, trackingNo, worker).catch(function (err) {
    console.warn('온라인 택배회송 처리 실패 - 오프라인 큐에 저장:', err);
    return queueAndSucceed_('processReturnParcel', { iprBarcode: iprBarcode, worker: worker, trackingNo: trackingNo });
  });
}

export function getPendingCount() {
  return db.getQueueCount();
}

export function syncNow() {
  return db.getQueueItems().then(function (items) {
    if (items.length === 0) {
      return { appliedCount: 0, duplicateCount: 0, notFoundCount: 0, errorCount: 0 };
    }
    return api.syncUp(items).then(function (res) {
      if (!res.success) throw new Error('동기화 실패');
      var results = res.results || [];
      var resolvedIprs = {};
      results.forEach(function (r) {
        if (r.status === 'applied' || r.status === 'duplicate' || r.status === 'not_found') {
          resolvedIprs[r.iprBarcode] = true;
        }
        // status === 'error'는 큐에 남겨 다음 동기화 시도 때 재시도한다.
      });
      var remaining = items.filter(function (item) { return !resolvedIprs[item.iprBarcode]; });
      return db.replaceQueue(remaining).then(function () {
        return summarizeSyncResults(results);
      });
    });
  });
}
