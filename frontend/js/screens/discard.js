import { escapeHtml } from '../lib/html.js';
import { SCREEN } from '../lib/state.js';

export function renderDiscard(root, ctx) {
  var inquiry = ctx.state.inquiry;
  root.innerHTML =
    '<div class="card card-discard">' +
    '  <h2>폐기 처리</h2>' +
    '  <p>IPR: ' + escapeHtml(inquiry.iprBarcode) + '</p>' +
    '  <p>폐기존으로 이동 후 사진을 촬영해주세요.</p>' +
    '  <input id="photoInput" type="file" accept="image/*" capture="environment" />' +
    '  <img id="photoPreview" style="display:none" />' +
    '  <button id="discardComplete" class="btn btn-discard" type="button" disabled>폐기처리 완료</button>' +
    '  <button id="discardCancel" class="btn btn-secondary" type="button">뒤로가기</button>' +
    '</div>';

  var photoBase64 = null;
  var latestRequestId = 0;

  root.querySelector('#photoInput').addEventListener('change', function (evt) {
    var file = evt.target.files[0];
    if (!file) return;
    var requestId = ++latestRequestId;
    var reader = new FileReader();
    reader.onload = function () {
      resizeImage_(reader.result, 1280).then(function (resized) {
        if (requestId !== latestRequestId) return; // 이후에 선택된 사진이 있으면 이 결과는 버린다
        photoBase64 = resized;
        var preview = root.querySelector('#photoPreview');
        preview.src = resized;
        preview.style.display = 'block';
        root.querySelector('#discardComplete').disabled = false;
      });
    };
    reader.readAsDataURL(file);
  });

  root.querySelector('#discardComplete').addEventListener('click', function () {
    root.querySelector('#discardComplete').disabled = true;
    ctx.sync.processDiscard(inquiry.iprBarcode, ctx.state.worker, photoBase64).then(function (res) {
      if (res.success) {
        var suffix = ' (동기화 대기 중 — 아직 서버에 반영되지 않음)';
        ctx.dispatch({ type: 'PROCESS_SUCCESS', text: 'D+6 폐기 처리가 완료되었습니다.' + suffix });
      } else {
        root.querySelector('#discardComplete').disabled = false;
        ctx.dispatch({ type: 'PROCESS_ERROR', text: '폐기 처리에 실패했습니다: ' + (res.error || '') });
      }
    });
  });

  root.querySelector('#discardCancel').addEventListener('click', function () {
    ctx.dispatch({ type: 'GO_BACK', screen: SCREEN.SCAN });
  });
}

function resizeImage_(dataUrl, maxSize) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      var ctx2d = canvas.getContext('2d');
      ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
  });
}
