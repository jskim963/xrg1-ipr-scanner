import { attachHidScanner } from '../scanner.js';

export function renderReturnParcel(root, ctx) {
  var inquiry = ctx.state.inquiry;
  root.innerHTML =
    '<div class="card card-return">' +
    '  <h2>택배 회송</h2>' +
    '  <p>IPR: ' + inquiry.iprBarcode + '</p>' +
    '  <p>운송장번호를 스캔해주세요.</p>' +
    '  <input id="trackingInput" class="hid-input" type="text" autocomplete="off" style="opacity:1;position:static;width:100%;height:auto;padding:10px;border:1px solid var(--line);border-radius:12px;" />' +
    '  <button id="returnParcelCancel" class="btn btn-secondary" type="button">취소</button>' +
    '</div>';

  var trackingInput = root.querySelector('#trackingInput');
  var submitted = false;
  attachHidScanner(trackingInput, function (value) {
    if (submitted) return;
    submitted = true;
    ctx.api.processReturnParcel(inquiry.iprBarcode, value, ctx.state.worker).then(function (res) {
      if (res.success) {
        ctx.dispatch({ type: 'PROCESS_SUCCESS', text: '택배 회송 처리가 완료되었습니다. (운송장: ' + value + ')' });
      } else {
        submitted = false;
        ctx.dispatch({ type: 'PROCESS_ERROR', text: '회송 처리에 실패했습니다: ' + (res.error || '') });
      }
    });
  });

  root.querySelector('#returnParcelCancel').addEventListener('click', function () {
    ctx.dispatch({ type: 'RESET_TO_SCAN' });
  });
}
