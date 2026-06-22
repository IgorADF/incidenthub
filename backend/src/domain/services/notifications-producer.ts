import {
  NotificationJobData,
  NotificationsProducerInterface,
} from "./notifications-producer.interface";

export class NotificationsProducerTestService
  implements NotificationsProducerInterface
{
  enqueuedJobs: NotificationJobData[] = [];

  async enqueue(data: NotificationJobData) {
    this.enqueuedJobs.push(data);
  }
}
