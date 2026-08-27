var DB_NAME = 'xrg1-ipr-scanner-offline';
var DB_VERSION = 1;
var STORE_SNAPSHOT = 'snapshot';
var STORE_QUEUE = 'queue';

function openDb_() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(STORE_SNAPSHOT)) {
        db.createObjectStore(STORE_SNAPSHOT, { keyPath: 'iprBarcode' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

export function saveSnapshot(items) {
  return openDb_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_SNAPSHOT, 'readwrite');
      var store = tx.objectStore(STORE_SNAPSHOT);
      store.clear();
      items.forEach(function (item) { store.put(item); });
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}

export function getSnapshot() {
  return openDb_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_SNAPSHOT, 'readonly');
      var req = tx.objectStore(STORE_SNAPSHOT).getAll();
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  });
}

export function addQueueItem(item) {
  return openDb_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).add(item);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}

export function getQueueItems() {
  return openDb_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_QUEUE, 'readonly');
      var req = tx.objectStore(STORE_QUEUE).getAll();
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  });
}

export function clearQueue() {
  return openDb_().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).clear();
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}

export function getQueueCount() {
  return getQueueItems().then(function (items) { return items.length; });
}
