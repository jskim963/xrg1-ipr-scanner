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
  return api.inquiry(iprBarcode).catch(function () {
    return Promise.all([db.getSnapshot(), db.getQueueItems()]).then(function (results) {
      return buildOfflineInquiryResult(results[0], results[1], iprBarcode);
    });
  });
}

function queueAndSucceed_(action, params) {
  var item = buildSyncQueueItem(action, Object.assign({ now: new Date() }, params));
  return db.addQueueItem(item).then(function () {
    return { success: true, offline: true };
  });
}

export function processDiscard(iprBarcode, worker, photoBase64) {
  return api.processDiscard(iprBarcode, worker, photoBase64).catch(function () {
    return queueAndSucceed_('processDiscard', { iprBarcode: iprBarcode, worker: worker, photoBase64: photoBase64 });
  });
}

export function processReturnVendor(iprBarcode, worker) {
  return api.processReturnVendor(iprBarcode, worker).catch(function () {
    return queueAndSucceed_('processReturnVendor', { iprBarcode: iprBarcode, worker: worker });
  });
}

export function processReturnParcel(iprBarcode, trackingNo, worker) {
  return api.processReturnParcel(iprBarcode, trackingNo, worker).catch(function () {
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
      return db.clearQueue().then(function () {
        return summarizeSyncResults(res.results);
      });
    });
  });
}
