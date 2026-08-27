import { escapeHtml } from '../lib/html.js';

export function renderReturnVendor(root, ctx) {
  var inquiry = ctx.state.inquiry;
  root.innerHTML =
    '<div class="card card-return">' +
    '  <h2>업체 트럭 회송</h2>' +
    '  <p>IPR: ' + escapeHtml(inquiry.iprBarcode) + '</p>' +
    '  <p>' + escapeHtml(inquiry.productName) + ' / ' + escapeHtml(inquiry.vendor) + ' / 수량 ' + escapeHtml(inquiry.qty) + '</p>' +
    '  <button id="returnVendorComplete" class="btn btn-return" type="button">회송처리 완료</button>' +
    '  <button id="returnVendorCancel" class="btn btn-secondary" type="button">취소</button>' +
    '</div>';

  root.querySelector('#returnVendorComplete').addEventListener('click', function () {
    root.querySelector('#returnVendorComplete').disabled = true;
    ctx.sync.processReturnVendor(inquiry.iprBarcode, ctx.state.worker).then(function (res) {
      if (res.success) {
        var suffix = res.offline ? ' (오프라인 처리 — 동기화 대기 중)' : '';
        ctx.dispatch({ type: 'PROCESS_SUCCESS', text: '업체 트럭 회송 처리가 완료되었습니다.' + suffix });
      } else {
        root.querySelector('#returnVendorComplete').disabled = false;
        ctx.dispatch({ type: 'PROCESS_ERROR', text: '회송 처리에 실패했습니다: ' + (res.error || '') });
      }
    });
  });

  root.querySelector('#returnVendorCancel').addEventListener('click', function () {
    ctx.dispatch({ type: 'RESET_TO_SCAN' });
  });
}
