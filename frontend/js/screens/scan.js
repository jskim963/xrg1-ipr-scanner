import { attachHidScanner } from '../scanner.js';
import { formatDateDisplay, formatDPlus6Badge, formatMethodLabel } from '../lib/format.js';
import { escapeHtml } from '../lib/html.js';

export function renderScan(root, ctx) {
  var inquiry = ctx.state.inquiry;
  var message = ctx.state.message;

  root.innerHTML =
    '<div class="scan-panel">' +
    '  <div class="sync-bar">' +
    '    <span id="pendingCount">동기화 대기: 확인 중...</span>' +
    '    <button id="refreshSnapshotBtn" class="btn btn-secondary" type="button">데이터 새로고침</button>' +
    '    <button id="syncNowBtn" class="btn btn-secondary" type="button">지금 동기화</button>' +
    '  </div>' +
    '  <div class="scanner-lcd">IPR SCAN LOG&#10;IPR바코드를 스캔해주세요</div>' +
    '  <input id="hidInput" class="hid-input" type="text" autocomplete="off" />' +
    '  <div class="manual-input-row">' +
    '    <input id="manualInput" type="text" autocomplete="off" placeholder="IPR바코드 직접 입력" />' +
    '    <button id="manualSubmit" class="btn btn-secondary" type="button">조회</button>' +
    '  </div>' +
    '  <button id="cameraBtn" class="btn btn-secondary" type="button">카메라로 스캔</button>' +
    '  <video id="scanVideo" class="scan-video" playsinline muted style="display:none"></video>' +
    (message ? '<p class="msg ' + message.type + '">' + escapeHtml(message.text) + '</p>' : '') +
    (inquiry ? renderInquiryCard_(inquiry) : '') +
    '</div>';

  refreshPendingCount_(root, ctx);

  root.querySelector('#refreshSnapshotBtn').addEventListener('click', function () {
    var btn = root.querySelector('#refreshSnapshotBtn');
    btn.disabled = true;
    ctx.sync.downloadSnapshot().then(function () {
      ctx.dispatch({ type: 'PROCESS_SUCCESS', text: '오프라인 데이터를 새로고침했습니다.' });
    }).catch(function () {
      btn.disabled = false;
      ctx.dispatch({ type: 'PROCESS_ERROR', text: '데이터 새로고침에 실패했습니다. 온라인 상태를 확인해주세요.' });
    });
  });

  root.querySelector('#syncNowBtn').addEventListener('click', function () {
    var btn = root.querySelector('#syncNowBtn');
    btn.disabled = true;
    ctx.sync.syncNow().then(function (summary) {
      ctx.dispatch({
        type: 'PROCESS_SUCCESS',
        text: '동기화 완료: 반영 ' + summary.appliedCount + '건, 중복 ' + summary.duplicateCount + '건, 미확인 ' + summary.notFoundCount + '건'
      });
    }).catch(function () {
      btn.disabled = false;
      ctx.dispatch({ type: 'PROCESS_ERROR', text: '동기화에 실패했습니다. 온라인 상태를 확인해주세요.' });
    });
  });

  var hidInput = root.querySelector('#hidInput');
  attachHidScanner(hidInput, function (value) { handleScan_(value, ctx); });

  var manualInput = root.querySelector('#manualInput');
  var submitManual = function () {
    var value = manualInput.value.trim();
    manualInput.value = '';
    if (value) handleScan_(value, ctx);
  };
  root.querySelector('#manualSubmit').addEventListener('click', submitManual);
  manualInput.addEventListener('keydown', function (evt) {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      submitManual();
    }
  });

  root.querySelector('#cameraBtn').addEventListener('click', function () {
    var video = root.querySelector('#scanVideo');
    video.style.display = 'block';
    ctx.scanner.startCameraScan(video, function (value) {
      video.style.display = 'none';
      handleScan_(value, ctx);
    }, function (err) {
      video.style.display = 'none';
      ctx.dispatch({ type: 'PROCESS_ERROR', text: err.message });
    });
  });

  if (inquiry && inquiry.found && !inquiry.duplicate) {
    root.querySelector('#discardBtn').addEventListener('click', function () {
      ctx.dispatch({ type: 'SELECT_DISCARD' });
    });
    root.querySelector('#returnBtn').addEventListener('click', function () {
      ctx.dispatch({ type: 'SELECT_RETURN' });
    });
  }
}

// 화면이 다시 그려질 때마다 새 요청이 시작되는데, 먼저 시작된 느린 요청이 나중에
// 끝나면 방금 동기화로 갱신된 최신 값을 오래된 값으로 덮어쓸 수 있다. 매 호출마다
// 토큰을 새로 발급해, 가장 마지막으로 시작된 요청의 결과만 반영되게 한다.
var latestPendingCountRequestId_ = 0;

function refreshPendingCount_(root, ctx) {
  var requestId = ++latestPendingCountRequestId_;
  ctx.sync.getPendingCount().then(function (count) {
    if (requestId !== latestPendingCountRequestId_) return;
    var el = root.querySelector('#pendingCount');
    if (el) el.textContent = '동기화 대기: ' + count + '건';
  });
}

function renderInquiryCard_(inquiry) {
  if (inquiry.offlineUnknown) {
    return '<div class="card card-danger">재확인 필요(오프라인 상태) — 온라인 연결 후 다시 확인해주세요.</div>';
  }
  if (!inquiry.found) {
    return '<div class="card card-danger">미등록 IPR바코드입니다.</div>';
  }
  if (inquiry.duplicate) {
    return '<div class="card card-danger">중복 IPR바코드가 감지되었습니다. 담당자에게 문의해주세요.</div>';
  }
  return (
    '<div class="card card-inquiry">' +
    (inquiry.alreadyProcessed ? '<div class="badge badge-warning">이미 처리된 건입니다 (' + escapeHtml(inquiry.existingStatus) + ')</div>' : '') +
    '<div class="field"><span>상품바코드</span><strong>' + escapeHtml(inquiry.productBarcode) + '</strong></div>' +
    '<div class="field"><span>상품명</span><strong>' + escapeHtml(inquiry.productName) + '</strong></div>' +
    '<div class="field"><span>오류신고일</span><strong>' + escapeHtml(formatDateDisplay(inquiry.reportDate)) + '</strong></div>' +
    '<div class="field"><span>벤더명</span><strong>' + escapeHtml(inquiry.vendor) + '</strong></div>' +
    '<div class="field"><span>수량</span><strong>' + escapeHtml(inquiry.qty) + '</strong></div>' +
    '<div class="field"><span>회수구분</span><strong>' + escapeHtml(formatMethodLabel(inquiry.method)) + '</strong></div>' +
    '<div class="field"><span>D+6 초과여부</span><strong>' + formatDPlus6Badge(inquiry.isOverDPlus6) + '</strong></div>' +
    '<div class="action-row">' +
    '  <button id="discardBtn" class="btn btn-discard" type="button">폐기 처리</button>' +
    '  <button id="returnBtn" class="btn btn-return" type="button">회송 처리</button>' +
    '</div>' +
    '</div>'
  );
}

function handleScan_(value, ctx) {
  ctx.sync.inquiry(value).then(function (res) {
    if (!res.success) {
      ctx.dispatch({ type: 'PROCESS_ERROR', text: '조회 중 오류가 발생했습니다.' });
      return;
    }
    res.iprBarcode = res.iprBarcode || value;
    ctx.dispatch({ type: 'INQUIRY_RESULT', result: res });
  });
}
