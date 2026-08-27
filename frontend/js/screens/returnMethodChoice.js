import { escapeHtml } from '../lib/html.js';

export function renderReturnMethodChoice(root, ctx) {
  var inquiry = ctx.state.inquiry;
  root.innerHTML =
    '<div class="card card-return">' +
    '  <h2>회송 방식 선택</h2>' +
    '  <p>IPR: ' + escapeHtml(inquiry.iprBarcode) + '</p>' +
    '  <p>' + escapeHtml(inquiry.productName) + ' / ' + escapeHtml(inquiry.vendor) + ' / 수량 ' + escapeHtml(inquiry.qty) + '</p>' +
    '  <div class="action-row">' +
    '    <button id="chooseVendor" class="btn btn-return" type="button">업체직접회수</button>' +
    '    <button id="chooseParcel" class="btn btn-return" type="button">택배</button>' +
    '  </div>' +
    '  <button id="returnMethodCancel" class="btn btn-secondary" type="button">취소</button>' +
    '</div>';

  root.querySelector('#chooseVendor').addEventListener('click', function () {
    ctx.dispatch({ type: 'CHOOSE_RETURN_METHOD', route: 'vendor' });
  });
  root.querySelector('#chooseParcel').addEventListener('click', function () {
    ctx.dispatch({ type: 'CHOOSE_RETURN_METHOD', route: 'parcel' });
  });
  root.querySelector('#returnMethodCancel').addEventListener('click', function () {
    ctx.dispatch({ type: 'RESET_TO_SCAN' });
  });
}
