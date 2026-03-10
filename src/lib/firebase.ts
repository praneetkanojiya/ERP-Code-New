import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// TODO: Replace with user's actual Firebase config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Sanity check for environment variables
if (typeof window !== 'undefined') {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("FIREBASE ERROR: Missing environment variables! Check NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
    } else {
        console.log("FIREBASE: Configuration loaded for project:", firebaseConfig.projectId);
    }
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connectivity Monitoring
if (typeof window !== 'undefined') {
    const { onSnapshotsInSync, onSnapshot, doc } = require("firebase/firestore");

    // Check if we are in sync with the server
    onSnapshotsInSync(db, () => {
        console.log("FIREBASE: Firestore snapshots are in sync with the server.");
    });

    // Try a "heartbeat" read to check connectivity (to a non-existent doc just to see it resolve)
    try {
        const testRef = doc(db, "_system_", "heartbeat");
        onSnapshot(testRef, (snapshot: any) => {
            console.log("FIREBASE: Connection established. Heartbeat status:", snapshot.exists() ? "Active" : "Ready");
        }, (error: any) => {
            console.error("FIREBASE CONNECTION ERROR:", error.code, error.message);
            if (error.code === 'permission-denied') {
                console.error("CRITICAL: Your Firestore Security Rules are blocking access!");
            }
        });
    } catch (e) {
        console.error("FIREBASE: Failed to set up heartbeat:", e);
    }
}

// Initialize Analytics conditionally
let analytics: any = null;
if (typeof window !== 'undefined') {
    isSupported().then((res: boolean) => res ? analytics = getAnalytics(app) : null);
}

export { app, db, auth, storage, analytics };
