export function buildOfflineInquiryResult(snapshotItems, queuedItems, iprBarcode) {
  var target = String(iprBarcode || '').trim();

  var queuedMatch = queuedItems.filter(function (q) {
    return String(q.iprBarcode || '').trim() === target;
  })[0];
  if (queuedMatch) {
    return {
      success: true,
      found: true,
      duplicate: false,
      alreadyProcessed: true,
      existingStatus: '오프라인 처리됨(동기화 대기 중)',
      offline: true,
      iprBarcode: target
    };
  }

  var snapshotMatch = snapshotItems.filter(function (s) {
    return String(s.iprBarcode || '').trim() === target;
  })[0];
  if (snapshotMatch) {
    return Object.assign(
      { success: true, found: true, duplicate: false, alreadyProcessed: false, existingStatus: null, offline: true },
      snapshotMatch
    );
  }

  return { success: true, found: false, offlineUnknown: true, offline: true };
}

export function buildSyncQueueItem(action, params) {
  return {
    action: action,
    iprBarcode: params.iprBarcode,
    worker: params.worker,
    photoBase64: params.photoBase64 || null,
    trackingNo: params.trackingNo || null,
    offlineTimestamp: params.now.toISOString()
  };
}

export function summarizeSyncResults(results) {
  var summary = { appliedCount: 0, duplicateCount: 0, notFoundCount: 0, errorCount: 0 };
  results.forEach(function (r) {
    if (r.status === 'applied') summary.appliedCount++;
    else if (r.status === 'duplicate') summary.duplicateCount++;
    else if (r.status === 'error') summary.errorCount++;
    else summary.notFoundCount++;
  });
  return summary;
}
