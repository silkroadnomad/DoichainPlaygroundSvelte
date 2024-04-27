export const DB_NAME = "Doichain";
let storeName = "transactions";

export function openDB(_dbName,_storeName) {
	if(!_dbName) _dbName = DB_NAME
	if(!_storeName) _storeName = storeName
	storeName = _storeName

	return new Promise((resolve, reject) => {

		const request = indexedDB.open(_dbName, 3);
		const db = request.result

		if (!db.objectStoreNames.contains(_storeName)) {
			db.createObjectStore(_storeName, {keyPath: "id"});
		}

		request.onupgradeneeded = (event) => {
			// const db = event.target.result;
		}

		request.onerror = (event) => reject(event.target.error);
		request.onsuccess = (event) => resolve(event.target.result);
	});
}

// Read data from the store
export async function readData(db,key) {
	console.log("storeName",storeName)
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readwrite");
		const objectStore = transaction.objectStore(storeName);
		let request
		if(key)	 request = objectStore.get(key)
		else request = objectStore.getAll()

		request.onerror = (event) => reject(event.target.error);
		request.onsuccess = (event) => resolve(event.target.result);
	});
}

export async function deleteData(db, id) {
	const tx = db.transaction(storeName, 'readwrite');
	const store = tx.objectStore(storeName);
	await store.delete(id);
	await tx.complete;
}

// Write data to the store
export async function addData(db, data) {
	return new Promise((resolve, reject) => {
		console.log("storeName",storeName)
		const transaction = db.transaction(storeName, "readwrite");
		const objectStore = transaction.objectStore(storeName);
		const request = objectStore.add(data);

		request.onerror = (event) => reject(event.target.error);
		request.onsuccess = () => resolve();
	});
}