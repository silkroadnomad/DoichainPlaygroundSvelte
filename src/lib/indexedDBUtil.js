const dbName = "BlockchainDB";
const storeName = "transactions";

// Open (or create) the database
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, 1);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName, { keyPath: "id" });
			}
		};

		request.onerror = (event) => reject(event.target.error);
		request.onsuccess = (event) => resolve(event.target.result);
	});
}

// Read data from the store
export async function readData(key) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], "readonly");
		const objectStore = transaction.objectStore(storeName);
		const request = objectStore.get(key);

		request.onerror = (event) => reject(event.target.error);
		request.onsuccess = (event) => resolve(event.target.result);
	});
}

// Write data to the store
export async function writeData(data) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], "readwrite");
		const objectStore = transaction.objectStore(storeName);
		const request = objectStore.put(data);

		request.onerror = (event) => reject(event.target.error);
		request.onsuccess = () => resolve();
	});
}