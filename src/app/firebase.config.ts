import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBdyZUu-0r1t_SXusQzmVDeMRTV6A5oWX0',
  authDomain: 'credit-card-mgr-app.firebaseapp.com',
  projectId: 'credit-card-mgr-app',
  storageBucket: 'credit-card-mgr-app.firebasestorage.app',
  messagingSenderId: '187364135239',
  appId: '1:187364135239:web:5f49e85780d6cbdf09bc62',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
