import { escapeHtml } from '../lib/html.js';
import { SCREEN } from '../lib/state.js';

export function renderReturnVendor(root, ctx) {
  var inquiry = ctx.state.inquiry;
  root.innerHTML =
    '<div class="card card-return">' +
    '  <h2>업체직접회수 처리</h2>' +
    '  <p>IPR: ' + escapeHtml(inquiry.iprBarcode) + '</p>' +
    '  <p>' + escapeHtml(inquiry.productName) + ' / ' + escapeHtml(inquiry.vendor) + ' / 수량 ' + escapeHtml(inquiry.qty) + '</p>' +
    '  <div class="action-row">' +
    '    <button id="zoneMoveBtn" class="btn btn-return" type="button">회송존 이동</button>' +
    '    <button id="pickupCompleteBtn" class="btn btn-return" type="button">회수 완료</button>' +
    '  </div>' +
    '  <button id="returnVendorBack" class="btn btn-secondary" type="button">뒤로가기</button>' +
    '</div>';

  root.querySelector('#zoneMoveBtn').addEventListener('click', function () {
    if (!window.confirm('회송존 이동으로 처리하시겠습니까?')) return;
    var btn = root.querySelector('#zoneMoveBtn');
    btn.disabled = true;
    ctx.sync.processReturnZoneMove(inquiry.iprBarcode, ctx.state.worker).then(function (res) {
      if (res.success) {
        var suffix = res.offline ? ' (오프라인 처리 — 동기화 대기 중)' : '';
        ctx.dispatch({ type: 'PROCESS_SUCCESS', text: '회송존 이동 처리가 완료되었습니다.' + suffix });
      } else {
        btn.disabled = false;
        ctx.dispatch({ type: 'PROCESS_ERROR', text: '회송존 이동 처리에 실패했습니다: ' + (res.error || '') });
      }
    });
  });

  root.querySelector('#pickupCompleteBtn').addEventListener('click', function () {
    if (!window.confirm('회수 완료로 처리하시겠습니까?')) return;
    var btn = root.querySelector('#pickupCompleteBtn');
    btn.disabled = true;
    ctx.sync.processReturnVendor(inquiry.iprBarcode, ctx.state.worker).then(function (res) {
      if (res.success) {
        var suffix = res.offline ? ' (오프라인 처리 — 동기화 대기 중)' : '';
        ctx.dispatch({ type: 'PROCESS_SUCCESS', text: '업체 트럭 회송 처리가 완료되었습니다.' + suffix });
      } else {
        btn.disabled = false;
        ctx.dispatch({ type: 'PROCESS_ERROR', text: '회송 처리에 실패했습니다: ' + (res.error || '') });
      }
    });
  });

  root.querySelector('#returnVendorBack').addEventListener('click', function () {
    ctx.dispatch({ type: 'GO_BACK', screen: SCREEN.RETURN_METHOD_CHOICE });
  });
}
