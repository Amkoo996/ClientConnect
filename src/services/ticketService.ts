import { Ticket, TicketStatus, TicketPriority, TicketFilter, TicketCategory } from "../types";
import { createNotification } from "./notificationService";
import { getAllAdmins } from "./userService";
import { db, auth } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';

export interface TicketCreationData {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  customFields?: Record<string, string>;
  clientId: string;
  clientName: string;
  clientEmail: string;
  adminId: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
}

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

export const createTicket = async (data: TicketCreationData, screenshot?: File): Promise<string> => {
  try {
    const ticketRef = doc(collection(db, 'tickets'));
    const ticketId = ticketRef.id;
    
    // Auto-assign logic based on category if not manually assigned
    let finalAssigneeId = data.assigneeId || null;
    let finalAssigneeName = data.assigneeName || null;

    if (!finalAssigneeId) {
      const admins = await getAllAdmins();
      if (admins.length > 0) {
        // Just assign to the first admin for simplicity, or keep it unassigned
        // finalAssigneeId = admins[0].uid;
        // finalAssigneeName = admins[0].displayName;
      }
    }

    const newTicket = {
      ...data,
      id: ticketId,
      status: "NEW" as TicketStatus,
      assigneeId: finalAssigneeId,
      assigneeName: finalAssigneeName,
      screenshotUrl: null, // We'd need Firebase Storage for real screenshots
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      closedAt: null,
    };

    await setDoc(ticketRef, newTicket);
    
    // Create notifications for all admins
    const admins = await getAllAdmins();
    for (const admin of admins) {
      await createNotification({
        userId: admin.uid,
        title: 'New Ticket Created',
        message: `${data.clientName} created a new ticket: "${data.title}"`,
        type: 'NEW_TICKET',
        linkId: ticketId,
      });
    }
    
    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tickets');
    throw error;
  }
};

export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const docRef = doc(db, 'tickets', ticketId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        closedAt: data.closedAt?.toDate() || null,
      } as Ticket;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `tickets/${ticketId}`);
    return null;
  }
};

export const getTicketsForAdmin = async (filter: TicketFilter): Promise<Ticket[]> => {
  try {
    let q = query(collection(db, 'tickets'));
    
    if (filter.status && filter.status !== "ALL") {
      q = query(q, where('status', '==', filter.status));
    }
    if (filter.priority && filter.priority !== "ALL") {
      q = query(q, where('priority', '==', filter.priority));
    }
    
    const querySnapshot = await getDocs(q);
    let filtered = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        closedAt: data.closedAt?.toDate() || null,
      } as Ticket;
    });

    if (filter.searchQuery) {
      const lowerQuery = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        t.clientName.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Sort
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return filtered;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'tickets');
    return [];
  }
};

export const getTicketsForClient = (clientId: string, callback: (tickets: Ticket[]) => void): (() => void) => {
  const q = query(collection(db, 'tickets'), where('clientId', '==', clientId));
  
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => {
      const data = doc.data({ serverTimestamps: 'estimate' });
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        closedAt: data.closedAt?.toDate() || null,
      } as Ticket;
    });
    
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(tickets);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tickets');
  });
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: serverTimestamp(),
      closedAt: status === "RESOLVED" ? serverTimestamp() : null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
  }
};

export const updateTicketAssignee = async (ticketId: string, assigneeId: string | null, assigneeName: string | null): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const docSnap = await getDoc(ticketRef);
    if (docSnap.exists()) {
      const currentStatus = docSnap.data().status;
      const newStatus = (!docSnap.data().assigneeId && assigneeId) ? "IN_PROGRESS" : currentStatus;
      
      await updateDoc(ticketRef, {
        assigneeId,
        assigneeName,
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
  }
};

export const getAllTickets = (callback: (tickets: Ticket[]) => void): (() => void) => {
  const q = query(collection(db, 'tickets'), where('status', 'in', ['NEW', 'IN_PROGRESS']));
  
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => {
      const data = doc.data({ serverTimestamps: 'estimate' });
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        closedAt: data.closedAt?.toDate() || null,
      } as Ticket;
    });
    
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(tickets);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tickets');
  });
};

export const uploadScreenshot = async (ticketId: string, file: File): Promise<string> => {
  // Mock upload since we don't have Storage set up
  return URL.createObjectURL(file);
};
