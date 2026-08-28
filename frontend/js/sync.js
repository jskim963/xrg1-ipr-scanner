import * as api from './api.js';
import * as db from './lib/offline-db.js';
import { buildOfflineInquiryResult, buildSyncQueueItem, summarizeSyncResults } from './lib/offline-logic.js';

var LAST_SYNC_KEY = 'xrg1-last-sync-at';

export function downloadSnapshot() {
  return api.syncDown().then(function (res) {
    if (!res.success) throw new Error('스냅샷 다운로드 실패');
    return db.saveSnapshot(res.items).then(function () {
      try {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      } catch (err) {
        console.warn('마지막 동기화 시각 저장 실패:', err);
      }
    });
  });
}

export function getLastSyncedAt() {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch (err) {
    return null;
  }
}

export function inquiry(iprBarcode) {
  return Promise.all([db.getSnapshot(), db.getQueueItems()]).then(function (results) {
    return buildOfflineInquiryResult(results[0], results[1], iprBarcode);
  });
}

function queueAndSucceed_(action, params) {
  var item = buildSyncQueueItem(action, Object.assign({ now: new Date() }, params));
  return db.addQueueItem(item).then(function () {
    return { success: true };
  }).catch(function (err) {
    console.warn('로컬 큐 저장 실패:', err);
    return { success: false, error: 'OFFLINE_QUEUE_FAILED' };
  });
}

export function processDiscard(iprBarcode, worker, photoBase64) {
  return queueAndSucceed_('processDiscard', { iprBarcode: iprBarcode, worker: worker, photoBase64: photoBase64 });
}

export function processReturnVendor(iprBarcode, worker) {
  return queueAndSucceed_('processReturnVendor', { iprBarcode: iprBarcode, worker: worker });
}

export function processReturnParcel(iprBarcode, trackingNo, worker) {
  return queueAndSucceed_('processReturnParcel', { iprBarcode: iprBarcode, worker: worker, trackingNo: trackingNo });
}

export function processReturnZoneMove(iprBarcode, worker) {
  return queueAndSucceed_('processReturnZoneMove', { iprBarcode: iprBarcode, worker: worker });
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
