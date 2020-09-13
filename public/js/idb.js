// establish a connection to IndexedDB database called 'tracking-budget' and set it to version 1
let db;
const request = indexedDB.open('tracking-budget', 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_entry', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {
    db = event.target.result;
    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
      uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// This function will be executed if user attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    const transaction = db.transaction(["new_entry"], "readwrite");
    const entryObjectStore = transaction.objectStore("new_entry");
    entryObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(["new_entry"], "readwrite");
    const entryObjectStore = transaction.objectStore("new_entry");
    const getAll = entryObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function and if there was data in indexedDb's store, let's send it to the api server
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_entry'], 'readwrite');
                const entryObjectStore = transaction.objectStore('new_entry');
                entryObjectStore.clear();

                alert('All saved transactions has been submitted!');
            })
            .catch(err => {
            console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);