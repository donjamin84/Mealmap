mport { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
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
        loadMenuItems(); // Call the loadMenuItems function when the user is signed in
    } else {
        console.log("No user is signed in");
        document.getElementById("sign-in-form").style.display = "block";
        document.getElementById("app-content").style.display = "none";
    }
});

// Define the loadMenuItems function
function loadMenuItems() {
    // Logic to load menu items goes here
    console.log("Loading menu items...");
    // Example: Fetch menu items from Firestore and display them
    // const db = getFirestore(app);
    // const menuItemsRef = collection(db, "menuItems");
    // getDocs(menuItemsRef).then((querySnapshot) => {
    //     querySnapshot.forEach((doc) => {
    //         console.log(`${doc.id} => ${doc.data()}`);
    //     });
    // });
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

async function signOutUser() {
    try {
        await signOut(auth);
        console.log("User signed out successfully");
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        loadMenuItems(currentWeek); // Load menu items after user is authenticated
    } else {
        console.log("No user is signed in");
        showSignInForm();
    }
});

function showSignInForm() {
    document.getElementById("sign-in-form").style.display = "block";
}

// Add your existing functions like loadMenuItems, renderMenuItems, etc. here
