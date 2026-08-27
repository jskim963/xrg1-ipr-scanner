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
  var detector = new window.BarcodeDetector();
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
