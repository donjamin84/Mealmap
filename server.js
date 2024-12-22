require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Firebase configuration endpoint
app.get('/firebase-config', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    });
});

// Fetch meals endpoint
app.get('/meals', async (req, res) => {
    try {
        const db = admin.database();
        const ref = db.ref('meals');
        const snapshot = await ref.once('value');
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.status(404).send('No data available');
        }
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
   
