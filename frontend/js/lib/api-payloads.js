export function buildInquiryPayload(iprBarcode) {
  return { action: 'inquiry', iprBarcode: iprBarcode };
}

export function buildDiscardPayload(iprBarcode, worker, photoBase64) {
  return { action: 'processDiscard', iprBarcode: iprBarcode, worker: worker, photoBase64: photoBase64 };
}

export function buildReturnVendorPayload(iprBarcode, worker) {
  return { action: 'processReturnVendor', iprBarcode: iprBarcode, worker: worker };
}

export function buildReturnParcelPayload(iprBarcode, trackingNo, worker) {
  return { action: 'processReturnParcel', iprBarcode: iprBarcode, trackingNo: trackingNo, worker: worker };
}

export function buildReturnZoneMovePayload(iprBarcode, worker) {
  return { action: 'processReturnZoneMove', iprBarcode: iprBarcode, worker: worker };
}
