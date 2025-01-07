import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcPkwXbdsaPAplUdZGmXhZGwEqiZmt-2A",
    authDomain: "mealplan-donja-2024.firebaseapp.com",
    projectId: "mealplan-donja-2024",
    storageBucket: "mealplan-donja-2024.firebasestorage.app",
    messagingSenderId: "1044176278835",
    appId: "1:1044176278835:web:648edf3829de455f365a46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign in function
document.getElementById("sign-in-button").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signIn(email, password);
});

async function signIn(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in successfully");
    } catch (error) {
        console.error("Error signing in:", error);
    }
}

// Sign out function
async function signOutUser() {
    try {
        await signOut(auth);
        console.log("User signed out successfully");
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        document.getElementById("sign-in-form").style.display = "none";
        document.getElementById("app-content").style.display = "block";
        // Call the loadMenuItems function from the appropriate script if needed
    } else {
        console.log("No user is signed in");
        document.getElementById("sign-in-form").style.display = "block";
        document.getElementById("app-content").style.display = "none";
    }
});

function showSignInForm() {
    document.getElementById("sign-in-form").style.display = "block";
}


