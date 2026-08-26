import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInquiryPayload,
  buildDiscardPayload,
  buildReturnVendorPayload,
  buildReturnParcelPayload
} from './api-payloads.js';

test('buildInquiryPayload', () => {
  assert.deepEqual(buildInquiryPayload('IPR1'), { action: 'inquiry', iprBarcode: 'IPR1' });
});

test('buildDiscardPayload', () => {
  const worker = { name: '홍길동', vfId: 'VF1' };
  assert.deepEqual(buildDiscardPayload('IPR1', worker, 'data:image/jpeg;base64,xxx'), {
    action: 'processDiscard',
    iprBarcode: 'IPR1',
    worker: worker,
    photoBase64: 'data:image/jpeg;base64,xxx'
  });
});

test('buildReturnVendorPayload', () => {
  const worker = { name: '홍길동', vfId: 'VF1' };
  assert.deepEqual(buildReturnVendorPayload('IPR1', worker), {
    action: 'processReturnVendor',
    iprBarcode: 'IPR1',
    worker: worker
  });
});

test('buildReturnParcelPayload', () => {
  const worker = { name: '홍길동', vfId: 'VF1' };
  assert.deepEqual(buildReturnParcelPayload('IPR1', '999888777', worker), {
    action: 'processReturnParcel',
    iprBarcode: 'IPR1',
    trackingNo: '999888777',
    worker: worker
  });
});
