export var SCREEN = {
  LOGIN: 'LOGIN',
  SCAN: 'SCAN',
  DISCARD_PHOTO: 'DISCARD_PHOTO',
  RETURN_METHOD_CHOICE: 'RETURN_METHOD_CHOICE',
  RETURN_VENDOR_CONFIRM: 'RETURN_VENDOR_CONFIRM',
  RETURN_PARCEL_SCAN: 'RETURN_PARCEL_SCAN'
};

export function initialState() {
  return { screen: SCREEN.LOGIN, worker: null, inquiry: null, message: null };
}

export function reduce(state, event) {
  switch (event.type) {
    case 'LOGIN_SUCCESS':
      return Object.assign({}, state, { screen: SCREEN.SCAN, worker: event.worker, message: null });
    case 'INQUIRY_RESULT':
      return Object.assign({}, state, { inquiry: event.result, message: null });
    case 'SELECT_DISCARD':
      return Object.assign({}, state, { screen: SCREEN.DISCARD_PHOTO });
    case 'SELECT_RETURN':
      return Object.assign({}, state, { screen: SCREEN.RETURN_METHOD_CHOICE });
    case 'CHOOSE_RETURN_METHOD':
      return Object.assign({}, state, {
        screen: event.route === 'parcel' ? SCREEN.RETURN_PARCEL_SCAN : SCREEN.RETURN_VENDOR_CONFIRM
      });
    case 'PROCESS_SUCCESS':
      return Object.assign({}, state, { screen: SCREEN.SCAN, inquiry: null, message: { type: 'success', text: event.text } });
    case 'PROCESS_ERROR':
      return Object.assign({}, state, { message: { type: 'error', text: event.text } });
    case 'RESET_TO_SCAN':
      return Object.assign({}, state, { screen: SCREEN.SCAN, inquiry: null, message: null });
    case 'LOGOUT':
      return initialState();
    default:
      return state;
  }
}
