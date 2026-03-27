import { collection, doc, setDoc, getDoc, query, where, orderBy, getDocs, onSnapshot, updateDoc, Timestamp, Unsubscribe, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Ticket, TicketStatus, TicketPriority, TicketFilter } from "../types";
import { uploadFile } from "./storageService";

export interface TicketCreationData {
  title: string;
  description: string;
  priority: TicketPriority;
  clientId: string;
  clientName: string;
  clientEmail: string;
  adminId: string;
}

export const createTicket = async (data: TicketCreationData, screenshot?: File): Promise<string> => {
  try {
    const ticketRef = doc(collection(db, "tickets"));
    const ticketId = ticketRef.id;
    
    let screenshotUrl: string | null = null;
    if (screenshot) {
      screenshotUrl = await uploadFile(`tickets/${ticketId}/screenshots/${screenshot.name}`, screenshot);
    }

    const newTicket = {
      id: ticketId,
      ...data,
      status: "NEW" as TicketStatus,
      screenshotUrl,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      closedAt: null,
    };

    await setDoc(ticketRef, newTicket);
    return ticketId;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw new Error("Failed to create ticket");
  }
};

export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const docRef = doc(db, "tickets", ticketId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        closedAt: data.closedAt ? data.closedAt.toDate() : null,
      } as Ticket;
    }
    return null;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    throw new Error("Failed to fetch ticket");
  }
};

export const getTicketsForAdmin = async (filter: TicketFilter): Promise<Ticket[]> => {
  try {
    let q = query(collection(db, "tickets"));
    
    if (filter.status && filter.status !== "ALL") {
      q = query(q, where("status", "==", filter.status));
    }
    if (filter.priority && filter.priority !== "ALL") {
      q = query(q, where("priority", "==", filter.priority));
    }
    
    const sortField = filter.sortBy || "createdAt";
    q = query(q, orderBy(sortField, "desc"), limit(20));

    const querySnapshot = await getDocs(q);
    let tickets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        closedAt: data.closedAt ? data.closedAt.toDate() : null,
      } as Ticket;
    });

    if (filter.searchQuery) {
      const lowerQuery = filter.searchQuery.toLowerCase();
      tickets = tickets.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        t.clientName.toLowerCase().includes(lowerQuery)
      );
    }

    return tickets;
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    throw new Error("Failed to fetch tickets");
  }
};

export const getTicketsForClient = (clientId: string, callback: (tickets: Ticket[]) => void): Unsubscribe => {
  const q = query(collection(db, "tickets"), where("clientId", "==", clientId), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const tickets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        closedAt: data.closedAt ? data.closedAt.toDate() : null,
      } as Ticket;
    });
    callback(tickets);
  }, (error) => {
    console.error("Error in real-time client tickets:", error);
  });
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<void> => {
  try {
    const ticketRef = doc(db, "tickets", ticketId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };
    if (status === "RESOLVED") {
      updateData.closedAt = Timestamp.now();
    }
    await updateDoc(ticketRef, updateData);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    throw new Error("Failed to update ticket status");
  }
};

export const getAllTickets = (callback: (tickets: Ticket[]) => void): Unsubscribe => {
  const q = query(collection(db, "tickets"), where("status", "in", ["NEW", "IN_PROGRESS"]), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const tickets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        closedAt: data.closedAt ? data.closedAt.toDate() : null,
      } as Ticket;
    });
    callback(tickets);
  }, (error) => {
    console.error("Error in real-time all tickets:", error);
  });
};

export const uploadScreenshot = async (ticketId: string, file: File): Promise<string> => {
  return uploadFile(`tickets/${ticketId}/screenshots/${file.name}`, file);
};
