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
  },
  api: api,
  scanner: scanner,
  sync: sync
};

// 하위 화면(뒤로가기가 있는 화면)에 처음 들어갈 때 브라우저 히스토리에 항목을 하나
// 쌓아둔다. 이렇게 하지 않으면 히스토리가 비어있어, 휴대폰/PDA의 기기 뒤로가기를
// 누르는 순간 되돌아갈 곳이 없어 앱 자체가 바로 꺼져버린다. 기기 뒤로가기를 누르면
// popstate가 발생하는데, 이때 앱 내 [뒤로가기] 버튼과 동일한 목적지로 이동시킨다.
var BACK_TARGET = {};
BACK_TARGET[SCREEN.DISCARD_PHOTO] = SCREEN.SCAN;
BACK_TARGET[SCREEN.RETURN_METHOD_CHOICE] = SCREEN.SCAN;
BACK_TARGET[SCREEN.RETURN_VENDOR_CHOICE] = SCREEN.RETURN_METHOD_CHOICE;
BACK_TARGET[SCREEN.RETURN_PARCEL_SCAN] = SCREEN.RETURN_METHOD_CHOICE;

var lastRenderedScreen = null;
var isHandlingPopstate = false;

window.addEventListener('popstate', function () {
  var target = BACK_TARGET[state.screen];
  if (!target) return; // SCAN/LOGIN 등 최상위 화면 - 기기의 기본 종료 동작에 맡긴다.
  isHandlingPopstate = true;
  ctx.dispatch({ type: 'GO_BACK', screen: target });
  isHandlingPopstate = false;
});

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
    case SCREEN.RETURN_VENDOR_CHOICE: renderReturnVendor(root, ctx); break;
    case SCREEN.RETURN_PARCEL_SCAN: renderReturnParcel(root, ctx); break;
  }

  if (!isHandlingPopstate && BACK_TARGET[state.screen] && state.screen !== lastRenderedScreen) {
    history.pushState({ screen: state.screen }, '', location.href);
  }
  lastRenderedScreen = state.screen;
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
