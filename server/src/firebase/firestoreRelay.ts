import admin from './admin';
import dotenv from 'dotenv';
dotenv.config();

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

// Listen for signup requests
export const listenForSignupRequests = (callback: (data: any, docId: string) => void) => {
  db.collection('signup_requests').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        callback(change.doc.data(), change.doc.id);
      }
    });
  });
};

export const writeSignupResult = async (docId: string, result: any) => {
  await db.collection('signup_responses').doc(docId).set(result);
};

// Listen for login requests
export const listenForLoginRequests = (callback: (data: any, docId: string) => void) => {
  db.collection('login_requests').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        callback(change.doc.data(), change.doc.id);
      }
    });
  });
};

export const writeLoginResult = async (docId: string, result: any) => {
  await db.collection('login_responses').doc(docId).set(result);
};

// Listen for auth check requests
export const listenForAuthCheckRequests = (callback: (data: any, docId: string) => void) => {
  db.collection('auth_check_requests').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        callback(change.doc.data(), change.doc.id);
      }
    });
  });
};

export const writeAuthCheckResult = async (docId: string, result: any) => {
  await db.collection('auth_check_responses').doc(docId).set(result);
}; 