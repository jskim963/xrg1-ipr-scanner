import { normalizeScanValue } from './lib/scan-parser.js';

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
