function doPost(e) {
  var result;
  try {
    var payload = JSON.parse(e.postData.contents);
    switch (payload.action) {
      case 'syncDown':
        result = handleSyncDown(payload);
        break;
      case 'syncUp':
        result = handleSyncUp(payload);
        break;
      default:
        result = { success: false, error: 'UNKNOWN_ACTION' };
    }
  } catch (err) {
    Logger.log('doPost error: ' + err + '\n' + (err && err.stack));
    result = { success: false, error: 'SERVER_ERROR', message: String(err) };
  }
  return jsonResponse_(result);
}
