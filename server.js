require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const admin = require('firebase-admin'); // Firebase Admin SDK
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    }),
});

// Firestore database instance
const db = admin.firestore();

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Fetch meals endpoint (uses Firestore backend securely)
app.get('/meals', async (req, res) => {
    try {
        const mealsRef = db.collection('meals'); // Reference to the "meals" collection
        const snapshot = await mealsRef.get();

        if (snapshot.empty) {
            return res.status(404).send('No meals found');
        }

        const meals = [];
        snapshot.forEach(doc => meals.push({ id: doc.id, ...doc.data() }));

        res.json(meals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send('Error fetching meals');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.send('Server is up and running!');
});

// Catch-all route for undefined paths
app.get('*', (req, res) => {
    res.status(404).send('404: Page not found');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



   
