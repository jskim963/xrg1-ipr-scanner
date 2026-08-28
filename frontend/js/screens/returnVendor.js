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

  // 이 화면은 버튼이 3개(회송존 이동/회수 완료/뒤로가기)이고 서로 다른 쓰기 동작을 한다.
  // 하나가 처리 중일 때 다른 버튼을 눌러 두 번째 요청이 동시에 나가면, 같은 건에 서로
  // 모순되는 값(예: 회송존 이동 + 회수 완료가 둘 다)이 기록되거나, 뒤로가기 후 다른 건을
  // 처리하는 도중 먼저 보낸 요청이 뒤늦게 성공 화면으로 튕겨버릴 수 있다. 그래서 셋 중
  // 하나라도 진행 중이면 나머지 버튼도 전부 눌리지 않게 막는다. confirm() 호출보다 먼저
  // 검사해야 한다 — confirm()은 메인 스레드를 막는 동기 호출이라, 빠르게 두 번 누른 두
  // 번째 클릭 이벤트는 첫 confirm()이 닫힌 뒤에야 실행되기 때문이다.
  var actionInFlight = false;

  function setAllButtonsDisabled_(disabled) {
    root.querySelector('#zoneMoveBtn').disabled = disabled;
    root.querySelector('#pickupCompleteBtn').disabled = disabled;
    root.querySelector('#returnVendorBack').disabled = disabled;
  }

  function bindConfirmedAction_(buttonId, confirmMessage, syncFn, successMessage, errorPrefix) {
    root.querySelector(buttonId).addEventListener('click', function () {
      if (actionInFlight) return;
      if (!window.confirm(confirmMessage)) return;
      actionInFlight = true;
      setAllButtonsDisabled_(true);
      syncFn().then(function (res) {
        if (res.success) {
          var suffix = ' (동기화 대기 중 — 아직 서버에 반영되지 않음)';
          ctx.dispatch({ type: 'PROCESS_SUCCESS', text: successMessage + suffix });
        } else {
          actionInFlight = false;
          setAllButtonsDisabled_(false);
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
    if (actionInFlight) return;
    ctx.dispatch({ type: 'GO_BACK', screen: SCREEN.RETURN_METHOD_CHOICE });
  });
}
