import { normalizeScanValue } from './lib/scan-parser.js';

// 화면을 아무데나 한 번 클릭(터치)하면 이 입력창이 포커스를 잃어 이후 스캔이 전혀 안 들어오는
// 문제를 막기 위해, 문서 전체 클릭을 감지해 포커스를 되돌린다. 화면이 다시 그려질 때마다
// attachHidScanner가 새 입력창으로 다시 호출되므로, 이전 화면의 리스너는 반드시 제거해야
// document에 리스너가 계속 쌓이는 것을 막을 수 있다.
var lastRefocusHandler = null;

export function attachHidScanner(inputEl, onScan) {
  inputEl.addEventListener('keydown', function (evt) {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      var value = normalizeScanValue(inputEl.value);
      inputEl.value = '';
      if (value) onScan(value);
    }
  });
  inputEl.focus();

  if (lastRefocusHandler) {
    document.removeEventListener('click', lastRefocusHandler);
  }
  lastRefocusHandler = function (evt) {
    // 클릭한 대상이 직접 입력/버튼(수동 입력창, 카메라 버튼 등)이면 그쪽 포커스를 그대로 두고,
    // 빈 화면(카드, 배경 등)을 클릭했을 때만 스캐너 입력창으로 포커스를 되돌린다.
    var tag = evt.target && evt.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;
    if (document.activeElement !== inputEl) {
      inputEl.focus();
    }
  };
  document.addEventListener('click', lastRefocusHandler);
}

// 파일럿 범위 내 의도된 선택: BarcodeDetector(Chrome/Android — PDA 및 대부분의 사용자 경로)는
// 이 함수를 전혀 거치지 않는다. ZXing은 비Chromium 브라우저(iOS Safari 등) 전용 폴백이며,
// 무결성 해시(SRI)나 로컬 번들링 없이 공개 CDN에서 로드한다 — 네트워크 제한 환경이나 CDN 장애 시
// 해당 브라우저에서만 카메라 스캔이 동작하지 않을 수 있다. 파일럿 단계에서는 허용 가능한 리스크로 판단.
function loadZXing_() {
  return new Promise(function (resolve, reject) {
    if (window.ZXing) return resolve(window.ZXing);
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';
    script.onload = function () { resolve(window.ZXing); };
    script.onerror = function () { reject(new Error('ZXing 라이브러리 로드에 실패했습니다.')); };
    document.head.appendChild(script);
  });
}

function startBarcodeDetectorScan_(videoEl, onScan, onError) {
  var detector;
  try {
    detector = new window.BarcodeDetector();
  } catch (err) {
    onError(err);
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(function (stream) {
      videoEl.srcObject = stream;
      videoEl.play();
      videoEl._scanStream = stream;
      videoEl._scanInterval = setInterval(function () {
        detector.detect(videoEl).then(function (codes) {
          if (codes.length > 0) {
            var value = normalizeScanValue(codes[0].rawValue);
            if (value) {
              stopCameraScan(videoEl);
              onScan(value);
            }
          }
        }).catch(function () {});
      }, 300);
    })
    .catch(onError);
}

function startZXingScan_(videoEl, ZXing, onScan, onError) {
  var reader = new ZXing.BrowserMultiFormatReader();
  videoEl._zxingReader = reader;
  reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, videoEl, function (result) {
    if (result) {
      var value = normalizeScanValue(result.getText());
      if (value) {
        stopCameraScan(videoEl);
        onScan(value);
      }
    }
  }).catch(onError);
}

export function startCameraScan(videoEl, onScan, onError) {
  if ('BarcodeDetector' in window) {
    startBarcodeDetectorScan_(videoEl, onScan, onError);
  } else {
    loadZXing_().then(function (ZXing) {
      startZXingScan_(videoEl, ZXing, onScan, onError);
    }).catch(onError);
  }
}

export function stopCameraScan(videoEl) {
  if (videoEl._scanInterval) { clearInterval(videoEl._scanInterval); videoEl._scanInterval = null; }
  if (videoEl._scanStream) { videoEl._scanStream.getTracks().forEach(function (t) { t.stop(); }); videoEl._scanStream = null; }
  if (videoEl._zxingReader) { videoEl._zxingReader.reset(); videoEl._zxingReader = null; }
}
