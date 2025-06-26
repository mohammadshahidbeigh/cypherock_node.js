import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';


admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

console.log('Firebase initialized');

const db = admin.firestore();

export const listenForProvisionRequests = (callback: (data: any, docId: string) => void) => {
  db.collection('provision_requests').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        callback(change.doc.data(), change.doc.id);
      }
    });
  });
};

export const writeProvisionResult = async (docId: string, result: any) => {
  await db.collection('provision_responses').doc(docId).set(result);
}; 