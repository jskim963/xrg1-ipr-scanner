import { attachHidScanner } from '../scanner.js';
import { escapeHtml } from '../lib/html.js';
import { SCREEN } from '../lib/state.js';

export function renderReturnParcel(root, ctx) {
  var inquiry = ctx.state.inquiry;
  root.innerHTML =
    '<div class="card card-return">' +
    '  <h2>택배 회송</h2>' +
    '  <p>IPR: ' + escapeHtml(inquiry.iprBarcode) + '</p>' +
    '  <p>운송장번호를 스캔해주세요.</p>' +
    '  <input id="trackingInput" class="hid-input" type="text" autocomplete="off" style="opacity:1;position:static;width:100%;height:auto;padding:10px;border:1px solid var(--line);border-radius:12px;" />' +
    '  <button id="returnParcelCancel" class="btn btn-secondary" type="button">뒤로가기</button>' +
    '</div>';

  var trackingInput = root.querySelector('#trackingInput');
  var submitted = false;
  attachHidScanner(trackingInput, function (value) {
    if (submitted) return;
    submitted = true;
    ctx.sync.processReturnParcel(inquiry.iprBarcode, value, ctx.state.worker).then(function (res) {
      if (res.success) {
        var suffix = res.offline ? ' (오프라인 처리 — 동기화 대기 중)' : '';
        ctx.dispatch({ type: 'PROCESS_SUCCESS', text: '택배 회송 처리가 완료되었습니다. (운송장: ' + value + ')' + suffix });
      } else {
        submitted = false;
        ctx.dispatch({ type: 'PROCESS_ERROR', text: '회송 처리에 실패했습니다: ' + (res.error || '') });
      }
    });
  });

  root.querySelector('#returnParcelCancel').addEventListener('click', function () {
    ctx.dispatch({ type: 'GO_BACK', screen: SCREEN.RETURN_METHOD_CHOICE });
  });
}
