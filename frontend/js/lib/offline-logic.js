export function buildOfflineInquiryResult(snapshotItems, queuedItems, iprBarcode) {
  var target = String(iprBarcode || '').trim();

  // '회송존 이동'은 최종 처리가 아니라 중간 상태다(설계 문서 10-4) — 큐에 이 액션만
  // 있는 건은 "이미 처리됨"이 아니라 여전히 미처리로 보여줘야, 나중에 회수 완료를
  // 정상적으로 진행할 수 있다.
  var queuedMatch = queuedItems.filter(function (q) {
    return String(q.iprBarcode || '').trim() === target && q.action !== 'processReturnZoneMove';
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
