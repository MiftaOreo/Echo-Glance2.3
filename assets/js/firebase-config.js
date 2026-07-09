/**
 * ECHO-GLANCE — Firebase Configuration (Client-Side)
 * 
 * CATATAN: File ini adalah placeholder.
 * Ganti kredensial di bawah dengan Firebase project Anda.
 * Untuk mengaktifkan real-time listener, uncomment kode di bawah.
 */

/*
// ============================================================
// FIREBASE SDK INITIALIZATION
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ============================================================
// REAL-TIME LISTENERS
// ============================================================

// Latest notification listener
export function listenNotifications(callback) {
    const notifRef = ref(db, 'notifications/latest');
    onValue(notifRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
}

// Device status listener
export function listenDeviceStatus(callback) {
    const statusRef = ref(db, 'device_status');
    onValue(statusRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
}

// MPU latest data listener
export function listenMPU(callback) {
    const mpuRef = ref(db, 'mpu_latest');
    onValue(mpuRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
}

// FSR latest data listener
export function listenFSR(callback) {
    const fsrRef = ref(db, 'fsr_latest');
    onValue(fsrRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
}
*/

// Currently using AJAX polling (see realtime.js)
console.log('[ECHO-GLANCE] Firebase module loaded (inactive — using AJAX polling)');
