export function renderLogin(root, ctx) {
  root.innerHTML =
    '<div class="card login-card">' +
    '  <h1>XRG1 IPR 스캐너</h1>' +
    '  <label>작업자명<input id="loginName" type="text" autocomplete="off" /></label>' +
    '  <label>VF ID<input id="loginVfId" type="text" autocomplete="off" /></label>' +
    '  <button id="loginSubmit" class="btn btn-primary" type="button">시작하기</button>' +
    '  <p id="loginError" class="error-text"></p>' +
    '</div>';

  root.querySelector('#loginSubmit').addEventListener('click', function () {
    var name = root.querySelector('#loginName').value.trim();
    var vfId = root.querySelector('#loginVfId').value.trim();
    if (!name || !vfId) {
      root.querySelector('#loginError').textContent = '작업자명과 VF ID를 모두 입력해주세요.';
      return;
    }
    ctx.dispatch({ type: 'LOGIN_SUCCESS', worker: { name: name, vfId: vfId } });
    ctx.sync.downloadSnapshot().catch(function () {
      ctx.dispatch({ type: 'PROCESS_ERROR', text: '오프라인 데이터 다운로드에 실패했습니다. 온라인 상태에서 다시 로그인해주세요.' });
    });
  });
}
