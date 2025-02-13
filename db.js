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
    let tx = db.transaction(STORE_NAME, "readwrite");
    let store = tx.objectStore(STORE_NAME);
    store.add(actionData);
}

async function getAllActions() {
    let db = await openDB();
    return new Promise((resolve) => {
        let tx = db.transaction(STORE_NAME, "readonly");
        let store = tx.objectStore(STORE_NAME);
        let request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}

async function clearAllActions() {
    let db = await openDB();
    let tx = db.transaction(STORE_NAME, "readwrite");
    let store = tx.objectStore(STORE_NAME);
    store.clear();
    console.log("✅ All user actions cleared from IndexedDB");
}
