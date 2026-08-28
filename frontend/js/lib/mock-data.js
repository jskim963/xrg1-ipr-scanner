export var MOCK_ROWS = {
  IPR0001: {
    found: true, duplicate: false, iprBarcode: 'IPR0001', productBarcode: 'S0000001',
    productName: '테스트 상품 A (택배 회송)', reportDate: '2026-08-10', vendor: '테스트벤더1',
    qty: 2, method: '택배', isOverDPlus6: '', alreadyProcessed: false, existingStatus: null
  },
  IPR0002: {
    found: true, duplicate: false, iprBarcode: 'IPR0002', productBarcode: 'S0000002',
    productName: '테스트 상품 B (업체직접회수)', reportDate: '2026-08-05', vendor: '테스트벤더2',
    qty: 1, method: '업체직접회수', isOverDPlus6: 'O', alreadyProcessed: false, existingStatus: null
  },
  IPR0003: {
    found: true, duplicate: false, iprBarcode: 'IPR0003', productBarcode: 'S0000003',
    productName: '테스트 상품 C (이미 처리됨)', reportDate: '2026-07-01', vendor: '테스트벤더3',
    qty: 5, method: '택배', isOverDPlus6: 'O', alreadyProcessed: true, existingStatus: '택배 회송'
  },
  IPR0004: { found: true, duplicate: true }
};

export function mockCall(action, payload) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      if (action === 'syncDown') {
        var items = Object.keys(MOCK_ROWS)
          .map(function (key) { return MOCK_ROWS[key]; })
          .filter(function (r) { return r.found && !r.duplicate && !r.alreadyProcessed; });
        resolve({ success: true, items: items });
        return;
      }
      if (action === 'syncUp') {
        var results = (payload.items || []).map(function (item) {
          return { iprBarcode: item.iprBarcode, status: 'applied' };
        });
        resolve({ success: true, results: results });
        return;
      }
      resolve({ success: false, error: 'UNKNOWN_ACTION' });
    }, 200);
  });
}
