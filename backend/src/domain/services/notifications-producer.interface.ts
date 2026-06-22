export type NotificationType =
  | "incident-started"
  | "incident-resolved"
  | "forgot-password";

export interface NotificationJobData {
  type: NotificationType;
  to: string;
  subject: string;
  body: string;
  incidentId?: string;
  serviceId?: string;
}

export interface NotificationsProducerInterface {
  enqueue: (data: NotificationJobData) => Promise<void>;
}
