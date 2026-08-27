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

  // 버튼 비활성화 확인을 confirm() 호출보다 먼저 한다: confirm()은 브라우저 메인 스레드를
  // 막는 동기 호출이라, 빠르게 두 번 누른 두 번째 클릭 이벤트는 confirm()이 닫힐 때까지
  // 대기했다가 그 다음에 실행된다. 그때 이미 버튼이 disabled인지 먼저 확인해야, 두 번째
  // 클릭이 또 다른 확인창을 띄우고 두 번째 처리 요청을 중복 발송하는 것을 막을 수 있다.
  function bindConfirmedAction_(buttonId, confirmMessage, syncFn, successMessage, errorPrefix) {
    var btn = root.querySelector(buttonId);
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      if (!window.confirm(confirmMessage)) return;
      btn.disabled = true;
      syncFn().then(function (res) {
        if (res.success) {
          var suffix = res.offline ? ' (오프라인 처리 — 동기화 대기 중)' : '';
          ctx.dispatch({ type: 'PROCESS_SUCCESS', text: successMessage + suffix });
        } else {
          btn.disabled = false;
          ctx.dispatch({ type: 'PROCESS_ERROR', text: errorPrefix + (res.error || '') });
        }
      });
    });
  }

  bindConfirmedAction_(
    '#zoneMoveBtn',
    '이 상품을 "회송존"으로 이동 처리합니다. 최종 회수 처리는 아직 완료되지 않은 상태로 남습니다. 계속하시겠습니까?',
    function () { return ctx.sync.processReturnZoneMove(inquiry.iprBarcode, ctx.state.worker); },
    '회송존 이동 처리가 완료되었습니다.',
    '회송존 이동 처리에 실패했습니다: '
  );

  bindConfirmedAction_(
    '#pickupCompleteBtn',
    '이 상품을 업체 트럭이 실제로 회수 완료한 것으로 최종 처리합니다. 계속하시겠습니까?',
    function () { return ctx.sync.processReturnVendor(inquiry.iprBarcode, ctx.state.worker); },
    '업체 트럭 회송 처리가 완료되었습니다.',
    '회송 처리에 실패했습니다: '
  );

  root.querySelector('#returnVendorBack').addEventListener('click', function () {
    ctx.dispatch({ type: 'GO_BACK', screen: SCREEN.RETURN_METHOD_CHOICE });
  });
}
