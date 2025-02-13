const DB_NAME = "UserActionDB";
const STORE_NAME = "actions";

function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      let db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function saveAction(actionData) {
  let db = await openDB();
  return new Promise((resolve, reject) => {
    let tx = db.transaction(STORE_NAME, "readwrite");
    let store = tx.objectStore(STORE_NAME);
    let request = store.add(actionData);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error("❌ Error adding action:", request.error);
      reject(request.error);
    };

    tx.oncomplete = () => {
      console.log("✅ Transaction completed");
    };

    tx.onerror = () => {
      console.error("❌ Transaction error:", tx.error);
    };
  });
}

async function getAllActions() {
  let db = await openDB();
  return new Promise((resolve, reject) => {
    let tx = db.transaction(STORE_NAME, "readonly");
    let store = tx.objectStore(STORE_NAME);
    let request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearAllActions() {
  let db = await openDB();
  return new Promise((resolve, reject) => {
    let tx = db.transaction(STORE_NAME, "readwrite");
    let store = tx.objectStore(STORE_NAME);
    let request = store.clear();
    request.onsuccess = () => {
      console.log("✅ All user actions cleared from IndexedDB");
      resolve();
    };
    request.onerror = () => {
      console.error("❌ Error clearing actions:", request.error);
      reject(request.error);
    };
  });
}
