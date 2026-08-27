import { initialState, reduce, SCREEN } from './lib/state.js';
import * as api from './api.js';
import * as scanner from './scanner.js';
import * as sync from './sync.js';
import { renderLogin } from './screens/login.js';
import { renderScan } from './screens/scan.js';
import { renderDiscard } from './screens/discard.js';
import { renderReturnMethodChoice } from './screens/returnMethodChoice.js';
import { renderReturnVendor } from './screens/returnVendor.js';
import { renderReturnParcel } from './screens/returnParcel.js';

var state = initialState();
var root = document.getElementById('app');

var ctx = {
  get state() { return state; },
  dispatch: function (event) {
    state = reduce(state, event);
    render();
    if (event.type === 'LOGIN_SUCCESS') {
      sync.downloadSnapshot().catch(function () {
        state = reduce(state, { type: 'PROCESS_ERROR', text: '오프라인 데이터 다운로드에 실패했습니다. 온라인 상태에서 다시 로그인해주세요.' });
        render();
      });
    }
  },
  api: api,
  scanner: scanner,
  sync: sync
};

function render() {
  var existingVideo = root.querySelector('#scanVideo');
  if (existingVideo) {
    scanner.stopCameraScan(existingVideo);
  }

  var badge = document.getElementById('workerBadge');
  if (state.worker) {
    badge.textContent = state.worker.name + ' / ' + state.worker.vfId;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }

  switch (state.screen) {
    case SCREEN.LOGIN: renderLogin(root, ctx); break;
    case SCREEN.SCAN: renderScan(root, ctx); break;
    case SCREEN.DISCARD_PHOTO: renderDiscard(root, ctx); break;
    case SCREEN.RETURN_METHOD_CHOICE: renderReturnMethodChoice(root, ctx); break;
    case SCREEN.RETURN_VENDOR_CONFIRM: renderReturnVendor(root, ctx); break;
    case SCREEN.RETURN_PARCEL_SCAN: renderReturnParcel(root, ctx); break;
  }
}

document.getElementById('homeBtn').addEventListener('click', function () {
  ctx.dispatch({ type: 'RESET_TO_SCAN' });
});
document.getElementById('logoutBtn').addEventListener('click', function () {
  ctx.dispatch({ type: 'LOGOUT' });
});

render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(function () {});
}
