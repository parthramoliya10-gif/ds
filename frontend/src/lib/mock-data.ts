import {
  User,
  Request,
  Message,
  Quotation,
  Payment,
  FinalDocument,
  Notification,
} from "@/types";

export const mockUsers: { student?: User; admin?: User; [key: string]: any } = {};
export const mockRequests: Request[] = [];
export const mockQuotations: Quotation[] = [];
export const mockMessages: Record<string, Message[]> = {};
export const mockPayments: Payment[] = [];
export const mockDocuments: FinalDocument[] = [];
export const mockNotifications: Notification[] = [];

/**
 * Helper to simulate network delay if needed
 */
export async function simulateAsync<T>(data: T, delayMs: number = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}
