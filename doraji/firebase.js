import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
        import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
        const firebaseConfig = {
            apiKey: "AIzaSyADO4zvx3JSxlDNAVSvLskqhcHcXqLzgIg",
            authDomain: "doraji-clicker.firebaseapp.com",
            projectId: "doraji-clicker",
            storageBucket: "doraji-clicker.firebasestorage.app",
            messagingSenderId: "24795860761",
            appId: "1:24795860761:web:bc4e0f55a9a8f0acd47f88"
        };

        const app = initializeApp(firebaseConfig);
        export const db = getFirestore(app);
        export const auth = getAuth(app);
        export const provider = new GoogleAuthProvider();