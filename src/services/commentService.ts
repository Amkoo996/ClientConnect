import { collection, doc, setDoc, query, where, orderBy, onSnapshot, deleteDoc, updateDoc, Timestamp, Unsubscribe, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Comment } from "../types";

export const addComment = async (ticketId: string, text: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Not authenticated");

    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) throw new Error("User not found");
    
    const userData = userSnap.data();

    const commentRef = doc(collection(db, "comments"));
    const newComment = {
      id: commentRef.id,
      ticketId,
      userId: currentUser.uid,
      userName: userData.displayName,
      userRole: userData.role,
      text,
      createdAt: Timestamp.now(),
      isEdited: false,
    };

    await setDoc(commentRef, newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error("Failed to add comment");
  }
};

export const getCommentsForTicket = (ticketId: string, callback: (comments: Comment[]) => void): Unsubscribe => {
  const q = query(collection(db, "comments"), where("ticketId", "==", ticketId), orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const comments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Comment;
    });
    callback(comments);
  }, (error) => {
    console.error("Error fetching comments:", error);
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, "comments", commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Failed to delete comment");
  }
};

export const editComment = async (commentId: string, newText: string): Promise<void> => {
  try {
    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, {
      text: newText,
      isEdited: true,
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    throw new Error("Failed to edit comment");
  }
};
