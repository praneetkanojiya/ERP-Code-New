import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, onSnapshotsInSync, onSnapshot, doc, setLogLevel } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Enforcing verbose logging to catch why addDoc hangs
if (typeof window !== 'undefined') {
    setLogLevel('debug');
    console.log("FIREBASE: Debug logging ENABLED.");
}

// Config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Sanity check for environment variables
if (typeof window !== 'undefined') {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("FIREBASE ERROR: Missing environment variables!");
    } else {
        console.log("FIREBASE: Config loaded for:", firebaseConfig.projectId);
    }

    // Connectivity Monitoring
    try {
        onSnapshotsInSync(db, () => {
            console.log("FIREBASE: Firestore snapshots are in sync.");
        });

        const testRef = doc(db, "_system_", "heartbeat");
        onSnapshot(testRef, (snapshot: any) => {
            console.log("FIREBASE: Connection heartbeat:", snapshot.exists() ? "Active" : "Ready");
        }, (error: any) => {
            console.error("FIREBASE CONNECTION ERROR:", error.code, error.message);
        });
    } catch (e) {
        console.error("FIREBASE: Failed to set up connection monitoring:", e);
    }
}

// Initialize Analytics
let analytics: any = null;
if (typeof window !== 'undefined') {
    isSupported().then((res: boolean) => {
        if (res) analytics = getAnalytics(app);
    }).catch((e: any) => console.error("Analytics Error:", e));
}

export { app, db, auth, storage, analytics };
