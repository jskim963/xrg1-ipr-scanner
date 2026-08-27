function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handleInquiry(payload) {
  var iprColumn = readIprColumnValues_();
  var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
  if (matches.length === 0) {
    return { success: true, found: false };
  }
  if (matches.length > 1) {
    return { success: true, found: true, duplicate: true };
  }
  var result = buildInquiryResult(readFullRow_(matches[0]));
  result.success = true;
  result.found = true;
  result.duplicate = false;
  if (result.reportDate instanceof Date) {
    result.reportDate = Utilities.formatDate(result.reportDate, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return result;
}

function handleProcessDiscard(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var photoUrl = uploadPhoto_(payload.photoBase64, 'discard_' + payload.iprBarcode + '_' + now.getTime());
    var update = buildProcessUpdate(ACTION_TYPE.DISCARD, now);
    writeProcessResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.finalStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId,
      photoUrl: photoUrl
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function handleProcessReturnVendor(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var update = buildProcessUpdate(ACTION_TYPE.RETURN_VENDOR, now);
    writeProcessResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.finalStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function handleProcessReturnParcel(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var update = buildProcessUpdate(ACTION_TYPE.RETURN_PARCEL, now, { trackingNo: payload.trackingNo });
    writeProcessResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.finalStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId,
      remark: '운송장번호: ' + (payload.trackingNo || '')
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function handleProcessReturnZoneMove(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 10초 대기
  try {
    var iprColumn = readIprColumnValues_();
    var matches = findMatchingIndexesInColumn(iprColumn, payload.iprBarcode);
    if (matches.length !== 1) {
      return { success: false, error: matches.length === 0 ? 'NOT_FOUND' : 'DUPLICATE' };
    }
    var now = new Date();
    var update = buildStagingUpdate(now);
    writeStagingResult_(matches[0], update);
    appendLogRow_(buildLogRow({
      timestamp: now,
      statusLabel: update.progressStatus,
      iprBarcode: payload.iprBarcode,
      workerName: payload.worker && payload.worker.name,
      vfId: payload.worker && payload.worker.vfId
    }));
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function handleSyncDown(payload) {
  var rows = readUnprocessedSnapshotRows_();
  var candidates = [];
  for (var i = 0; i < rows.length; i++) {
    var ipr = String(rows[i][COLUMNS.IPR] || '').trim();
    var finalStatus = String(rows[i][COLUMNS.FINAL_STATUS] || '').trim();
    if (ipr === '' || finalStatus !== '') continue;
    var result = buildInquiryResult(rows[i]);
    if (result.reportDate instanceof Date) {
      result.reportDate = Utilities.formatDate(result.reportDate, 'Asia/Seoul', 'yyyy-MM-dd');
    }
    delete result.alreadyProcessed;
    delete result.existingStatus;
    candidates.push(result);
  }

  var countByIpr = {};
  candidates.forEach(function (item) {
    countByIpr[item.iprBarcode] = (countByIpr[item.iprBarcode] || 0) + 1;
  });
  // 같은 IPR바코드가 미처리 행에 2개 이상 있으면(데이터 중복) 오프라인 스냅샷에서 제외한다.
  // 온라인 조회는 이런 경우 "중복 IPR바코드 감지"로 처리를 막지만, 오프라인은 사용자에게
  // 그 자리에서 확인받을 방법이 없으므로 아예 스냅샷에 넣지 않아 "재확인 필요"로 안전하게 처리되게 한다.
  var items = candidates.filter(function (item) { return countByIpr[item.iprBarcode] === 1; });

  return { success: true, items: items };
}

function applySyncItem_(item, iprColumn) {
  var actionType = item.action === 'processDiscard' ? ACTION_TYPE.DISCARD
    : item.action === 'processReturnVendor' ? ACTION_TYPE.RETURN_VENDOR
    : item.action === 'processReturnParcel' ? ACTION_TYPE.RETURN_PARCEL
    : item.action === 'processReturnZoneMove' ? ACTION_TYPE.RETURN_ZONE_MOVE
    : null;
  if (actionType === null) {
    return { iprBarcode: item.iprBarcode, status: 'error', message: 'Unknown action: ' + item.action };
  }

  var matches = findMatchingIndexesInColumn(iprColumn, item.iprBarcode);
  if (matches.length !== 1) {
    return { iprBarcode: item.iprBarcode, status: 'not_found' };
  }
  var rowIndex = matches[0];
  var currentRow = readFullRow_(rowIndex);
  var alreadyProcessed = String(currentRow[COLUMNS.FINAL_STATUS] || '').trim() !== '';
  var timestamp = item.offlineTimestamp ? new Date(item.offlineTimestamp) : new Date();

  if (alreadyProcessed) {
    markDuplicateScan_(rowIndex);
    appendLogRow_(buildLogRow({
      timestamp: timestamp,
      statusLabel: '중복스캔',
      iprBarcode: item.iprBarcode,
      workerName: item.worker && item.worker.name,
      vfId: item.worker && item.worker.vfId,
      remark: '오프라인 동기화 중 이미 처리된 건과 중복 - 값 유지되지 않음'
    }));
    return { iprBarcode: item.iprBarcode, status: 'duplicate' };
  }

  if (actionType === ACTION_TYPE.RETURN_ZONE_MOVE) {
    var stagingUpdate = buildStagingUpdate(timestamp);
    // 회송존 이동은 S/T열(FINAL_STATUS)을 쓰지 않으므로 위 alreadyProcessed 판정으로는
    // "같은 회송존 이동 요청의 재전송"을 걸러낼 수 없다(예: syncUp 응답이 유실되어 클라이언트가
    // 같은 큐 항목을 다시 보내는 경우). X열이 이미 같은 값이면 재전송으로 보고 다시 쓰거나
    // 로그를 또 남기지 않는다.
    var alreadyStaged = String(currentRow[COLUMNS.PROGRESS_STATUS] || '').trim() === stagingUpdate.progressStatus;
    if (!alreadyStaged) {
      writeStagingResult_(rowIndex, stagingUpdate);
      appendLogRow_(buildLogRow({
        timestamp: timestamp,
        statusLabel: stagingUpdate.progressStatus,
        iprBarcode: item.iprBarcode,
        workerName: item.worker && item.worker.name,
        vfId: item.worker && item.worker.vfId,
        remark: '(오프라인 동기화)'
      }));
    }
    return { iprBarcode: item.iprBarcode, status: 'applied' };
  }

  var photoUrl = '';
  if (actionType === ACTION_TYPE.DISCARD && item.photoBase64) {
    photoUrl = uploadPhoto_(item.photoBase64, 'discard_' + item.iprBarcode + '_' + timestamp.getTime());
  }
  var update = buildProcessUpdate(actionType, timestamp, { trackingNo: item.trackingNo });
  writeProcessResult_(rowIndex, update);
  appendLogRow_(buildLogRow({
    timestamp: timestamp,
    statusLabel: update.finalStatus,
    iprBarcode: item.iprBarcode,
    workerName: item.worker && item.worker.name,
    vfId: item.worker && item.worker.vfId,
    photoUrl: photoUrl,
    remark: actionType === ACTION_TYPE.RETURN_PARCEL
      ? ('운송장번호: ' + (item.trackingNo || '') + ' (오프라인 동기화)')
      : '(오프라인 동기화)'
  }));
  return { iprBarcode: item.iprBarcode, status: 'applied' };
}

function handleSyncUp(payload) {
  var items = payload.items || [];
  var iprColumn = readIprColumnValues_();
  var results = [];
  for (var i = 0; i < items.length; i++) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (lockErr) {
      results.push({ iprBarcode: items[i].iprBarcode, status: 'error', message: 'LOCK_TIMEOUT' });
      continue;
    }
    try {
      results.push(applySyncItem_(items[i], iprColumn));
    } catch (err) {
      results.push({ iprBarcode: items[i].iprBarcode, status: 'error', message: String(err) });
    } finally {
      lock.releaseLock();
    }
  }
  return { success: true, results: results };
}
