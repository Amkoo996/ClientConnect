import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }).describe("User email address"),
  displayName: z.string().min(2, { message: "Name must be at least 2 characters" }).max(50, { message: "Name must be at most 50 characters" }).describe("User full name"),
  companyName: z.string().optional().describe("Company name (optional)"),
});

export const createTicketSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(200, { message: "Title must be at most 200 characters" }).describe("Ticket title"),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(5000, { message: "Description must be at most 5000 characters" }).describe("Ticket description"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], { message: "Priority is required" }).describe("Ticket priority"),
  category: z.enum(["BUG", "FEATURE", "BILLING", "GENERAL"], { message: "Category is required" }).describe("Ticket category"),
  customFields: z.record(z.string(), z.string()).optional(),
});

export const createCommentSchema = z.object({
  text: z.string().min(1, { message: "Comment cannot be empty" }).max(2000, { message: "Comment must be at most 2000 characters" }).refine(val => val.trim().length > 0, { message: "Comment cannot be only whitespace" }).describe("Comment text"),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }).describe("Email address"),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" }).describe("Password"),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"], { message: "Status is required" }).describe("Ticket status"),
});
