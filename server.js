   const express = require('express');
   const dotenv = require('dotenv');
   const admin = require('firebase-admin');

   // Load environment variables from .env file
   dotenv.config();

   const app = express();
   const port = process.env.PORT || 3000;

   // Initialize Firebase Admin SDK
   admin.initializeApp({
       credential: admin.credential.cert({
           projectId: process.env.FIREBASE_PROJECT_ID,
           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
           privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
       }),
       databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
   });

   const db = admin.firestore();

   app.get('/api/menu/:week', async (req, res) => {
       const week = parseInt(req.params.week, 10);
       try {
           const mealsRef = db.collection('meals');
           const snapshot = await mealsRef.where('week', '==', week).get();
           if (snapshot.empty) {
               return res.status(404).json({ message: 'No menu items found for this week' });
           }
           const meals = snapshot.docs.map(doc => doc.data());
           res.json(meals);
       } catch (error) {
           console.error('Error fetching menu items:', error);
           res.status(500).json({ error: 'Internal Server Error' });
       }
   });

   app.listen(port, () => {
       console.log(`Server is running on port ${port}`);
   });
   