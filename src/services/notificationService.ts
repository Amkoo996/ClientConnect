import { collection, addDoc, onSnapshot, query, where, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Notification } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const createNotification = async (data: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data({ serverTimestamps: 'estimate' });
      notifications.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Notification);
    });
    
    // Sort client-side to avoid index requirement
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'notifications');
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }));
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
};
