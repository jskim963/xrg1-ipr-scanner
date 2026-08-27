import { attachHidScanner } from '../scanner.js';
import { formatDateDisplay, formatDPlus6Badge, formatMethodLabel, determineReturnRoute } from '../lib/format.js';
import { escapeHtml } from '../lib/html.js';

export function renderScan(root, ctx) {
  var inquiry = ctx.state.inquiry;
  var message = ctx.state.message;

  root.innerHTML =
    '<div class="scan-panel">' +
    '  <div class="scanner-lcd">IPR SCAN LOG&#10;IPR바코드를 스캔해주세요</div>' +
    '  <input id="hidInput" class="hid-input" type="text" autocomplete="off" />' +
    '  <button id="cameraBtn" class="btn btn-secondary" type="button">카메라로 스캔</button>' +
    '  <video id="scanVideo" class="scan-video" playsinline muted style="display:none"></video>' +
    (message ? '<p class="msg ' + message.type + '">' + escapeHtml(message.text) + '</p>' : '') +
    (inquiry ? renderInquiryCard_(inquiry) : '') +
    '</div>';

  var hidInput = root.querySelector('#hidInput');
  attachHidScanner(hidInput, function (value) { handleScan_(value, ctx); });

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
      ctx.dispatch({ type: 'SELECT_RETURN', route: determineReturnRoute(inquiry.method) });
    });
  }
}

function renderInquiryCard_(inquiry) {
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
  ctx.api.inquiry(value).then(function (res) {
    if (!res.success) {
      ctx.dispatch({ type: 'PROCESS_ERROR', text: '조회 중 오류가 발생했습니다.' });
      return;
    }
    res.iprBarcode = res.iprBarcode || value;
    ctx.dispatch({ type: 'INQUIRY_RESULT', result: res });
  });
}
