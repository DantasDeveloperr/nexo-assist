
export type MessageSenderType = "EMPLOYEE" | "AGENT" | "ANALYST";

export type MessageProcessingStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface Message {
  id: string;
  conversationId: string;
  senderEmployeeId: string | null;
  senderType: MessageSenderType;
  content: string;
  processingStatus: MessageProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
}
