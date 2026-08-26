function doPost(e) {
  var result;
  try {
    var payload = JSON.parse(e.postData.contents);
    switch (payload.action) {
      case 'inquiry':
        result = handleInquiry(payload);
        break;
      case 'processDiscard':
        result = handleProcessDiscard(payload);
        break;
      case 'processReturnVendor':
        result = handleProcessReturnVendor(payload);
        break;
      case 'processReturnParcel':
        result = handleProcessReturnParcel(payload);
        break;
      default:
        result = { success: false, error: 'UNKNOWN_ACTION' };
    }
  } catch (err) {
    result = { success: false, error: 'SERVER_ERROR', message: String(err) };
  }
  return jsonResponse_(result);
}
