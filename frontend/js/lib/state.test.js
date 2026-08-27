import test from 'node:test';
import assert from 'node:assert/strict';
import { SCREEN, initialState, reduce } from './state.js';

test('initialState: 로그인 화면에서 시작한다', () => {
  const state = initialState();
  assert.equal(state.screen, SCREEN.LOGIN);
  assert.equal(state.worker, null);
});

test('LOGIN_SUCCESS: 스캔 화면으로 이동하고 작업자 정보를 저장한다', () => {
  const state = reduce(initialState(), { type: 'LOGIN_SUCCESS', worker: { name: '홍길동', vfId: 'VF1' } });
  assert.equal(state.screen, SCREEN.SCAN);
  assert.deepEqual(state.worker, { name: '홍길동', vfId: 'VF1' });
});

test('INQUIRY_RESULT: 조회 결과를 상태에 저장한다', () => {
  const loggedIn = reduce(initialState(), { type: 'LOGIN_SUCCESS', worker: { name: 'a', vfId: 'b' } });
  const state = reduce(loggedIn, { type: 'INQUIRY_RESULT', result: { found: true, iprBarcode: 'IPR1' } });
  assert.deepEqual(state.inquiry, { found: true, iprBarcode: 'IPR1' });
});

test('SELECT_DISCARD: 폐기 사진 화면으로 이동한다', () => {
  const state = reduce(initialState(), { type: 'SELECT_DISCARD' });
  assert.equal(state.screen, SCREEN.DISCARD_PHOTO);
});

test('SELECT_RETURN: 회송 방식 선택 화면으로 이동한다', () => {
  assert.equal(reduce(initialState(), { type: 'SELECT_RETURN' }).screen, SCREEN.RETURN_METHOD_CHOICE);
});

test('CHOOSE_RETURN_METHOD: route가 parcel이면 택배 스캔 화면, vendor면 업체 확인 화면으로 이동한다', () => {
  assert.equal(reduce(initialState(), { type: 'CHOOSE_RETURN_METHOD', route: 'parcel' }).screen, SCREEN.RETURN_PARCEL_SCAN);
  assert.equal(reduce(initialState(), { type: 'CHOOSE_RETURN_METHOD', route: 'vendor' }).screen, SCREEN.RETURN_VENDOR_CHOICE);
});

test('PROCESS_SUCCESS: 스캔 화면으로 복귀하고 조회 결과를 비우며 성공 메시지를 남긴다', () => {
  const withInquiry = reduce(initialState(), { type: 'INQUIRY_RESULT', result: { found: true } });
  const state = reduce(withInquiry, { type: 'PROCESS_SUCCESS', text: '완료' });
  assert.equal(state.screen, SCREEN.SCAN);
  assert.equal(state.inquiry, null);
  assert.deepEqual(state.message, { type: 'success', text: '완료' });
});

test('PROCESS_ERROR: 화면은 유지한 채 오류 메시지를 남긴다', () => {
  const discardScreen = reduce(initialState(), { type: 'SELECT_DISCARD' });
  const state = reduce(discardScreen, { type: 'PROCESS_ERROR', text: '실패' });
  assert.equal(state.screen, SCREEN.DISCARD_PHOTO);
  assert.deepEqual(state.message, { type: 'error', text: '실패' });
});

test('RESET_TO_SCAN: 스캔 화면으로 돌아가고 조회 결과를 비운다', () => {
  const state = reduce({ screen: SCREEN.DISCARD_PHOTO, worker: { name: 'a' }, inquiry: { x: 1 }, message: null }, { type: 'RESET_TO_SCAN' });
  assert.equal(state.screen, SCREEN.SCAN);
  assert.equal(state.inquiry, null);
  assert.deepEqual(state.worker, { name: 'a' });
});

test('LOGOUT: 초기 상태로 완전히 되돌아간다', () => {
  const loggedIn = reduce(initialState(), { type: 'LOGIN_SUCCESS', worker: { name: 'a', vfId: 'b' } });
  const state = reduce(loggedIn, { type: 'LOGOUT' });
  assert.deepEqual(state, initialState());
});

test('알 수 없는 이벤트는 상태를 그대로 반환한다', () => {
  const state = initialState();
  assert.equal(reduce(state, { type: 'NOPE' }), state);
});

test('GO_BACK: 지정된 화면으로 이동하고 조회 결과는 유지한다', () => {
  const withInquiry = reduce(initialState(), { type: 'INQUIRY_RESULT', result: { found: true } });
  const discardScreen = reduce(withInquiry, { type: 'SELECT_DISCARD' });
  const state = reduce(discardScreen, { type: 'GO_BACK', screen: SCREEN.SCAN });
  assert.equal(state.screen, SCREEN.SCAN);
  assert.deepEqual(state.inquiry, { found: true });
});

test('GO_BACK: 메시지를 비운다', () => {
  const withMessage = reduce(initialState(), { type: 'PROCESS_ERROR', text: '오류' });
  const state = reduce(withMessage, { type: 'GO_BACK', screen: SCREEN.SCAN });
  assert.equal(state.message, null);
});
