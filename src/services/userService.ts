import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { User, Role } from "../types";

export interface UserCreationData {
  uid: string;
  email: string;
  role: Role;
  displayName: string;
  companyName?: string;
}

export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { ...data, createdAt: data.createdAt.toDate() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user");
  }
};

export const createUser = async (data: UserCreationData): Promise<void> => {
  try {
    const userRef = doc(db, "users", data.uid);
    const userData = {
      ...data,
      createdAt: Timestamp.now(),
      isActive: true,
    };
    await setDoc(userRef, userData);
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

export const updateUser = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

export const getAllClients = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "CLIENT"), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, createdAt: data.createdAt.toDate() } as User;
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to fetch clients");
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { isActive: false });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};
