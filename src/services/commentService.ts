import { Comment } from "../types";
import { createNotification } from "./notificationService";
import { getTicketById } from "./ticketService";
import { db, auth } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';

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
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const addComment = async (
  ticketId: string, 
  text: string,
  userId: string,
  userName: string,
  userRole: "ADMIN" | "CLIENT"
): Promise<void> => {
  try {
    const commentRef = doc(collection(db, 'comments'));
    const commentId = commentRef.id;

    const newComment = {
      id: commentId,
      ticketId,
      userId,
      userName,
      userRole,
      text,
      createdAt: serverTimestamp(),
      isEdited: false,
    };

    await setDoc(commentRef, newComment);
    
    if (userRole === 'ADMIN') {
      const ticket = await getTicketById(ticketId);
      if (ticket) {
        await createNotification({
          userId: ticket.clientId,
          title: 'New Comment on your Ticket',
          message: `${userName} added a comment to "${ticket.title}"`,
          type: 'NEW_COMMENT',
          linkId: ticketId,
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'comments');
    throw error;
  }
};

export const getCommentsForTicket = (ticketId: string, callback: (comments: Comment[]) => void): (() => void) => {
  const q = query(collection(db, 'comments'), where('ticketId', '==', ticketId));
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => {
      const data = doc.data({ serverTimestamps: 'estimate' });
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Comment;
    });
    
    comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    callback(comments);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'comments');
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
  }
};

export const editComment = async (commentId: string, newText: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      text: newText,
      isEdited: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
  }
};
