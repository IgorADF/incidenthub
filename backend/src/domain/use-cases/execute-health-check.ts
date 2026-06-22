import { HealthCheck } from "@domain/entities/health-check";
import { Incident } from "@domain/entities/incident";
import { Service, ServiceType } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { HttpPingerInterface } from "@domain/services/http-pinger.interface";
import {
  NotificationJobData,
  NotificationsProducerInterface,
} from "@domain/services/notifications-producer.interface";

type ExecuteHealthCheckResult = {
  skipped?: boolean;
  reason?: string;
  healthCheck?: HealthCheck;
  incident?: Incident;
};

export class ExecuteHealthCheck {
  constructor(
    private readonly uow: UOW,
    private readonly pinger: HttpPingerInterface,
    private readonly notificationsProducer: NotificationsProducerInterface,
  ) {}

  async execute(serviceId: string): Promise<ExecuteHealthCheckResult> {
    const service = await this.uow.repositories.services.getById(serviceId);

    if (!service) {
      return { skipped: true, reason: "not-found" };
    }

    if (!service.getProps().enabled) {
      return { skipped: true, reason: "disabled" };
    }

    const result = await this.pinger.ping({
      url: service.getProps().url,
      timeoutSeconds: service.getProps().timeoutSeconds,
      expectedResponseStatus: service.getProps().expectedResponseStatus,
    });

    const txResult = await this.uow.transaction(async (repositories) => {
      const healthCheck = HealthCheck.create({
        serviceId: service.getProps().id,
        url: service.getProps().url,
        requestTime: result.requestTimeMs,
        isError: result.isError,
        timedOut: result.timedOut,
        responseStatus: result.responseStatus,
        responseJsonData: result.responseBody,
      });

      await repositories.healthChecks.create(healthCheck);

      const { updatedService, incident, notification } = result.ok
        ? await this.handleSuccess(repositories, service)
        : await this.handleFailure(repositories, service);

      await repositories.services.update(updatedService);

      return { healthCheck, incident, notification };
    });

    await this.enqueueNotification(txResult.notification);

    return {
      healthCheck: txResult.healthCheck,
      incident: txResult.incident ?? undefined,
    };
  }

  private async handleSuccess(
    repositories: UOW["repositories"],
    service: Service,
  ): Promise<{
    updatedService: Service;
    incident: Incident | null;
    notification: NotificationJobData | null;
  }> {
    const now = new Date();
    const props = service.getProps();

    let updatedService = service
      .recordSuccess()
      .markCheckedAt(now)
      .markChecking();
    let incident: Incident | null = null;
    let notification: NotificationJobData | null = null;

    if (props.currentIncidentId) {
      const openIncident = await repositories.incidents.getById(
        props.currentIncidentId,
      );

      updatedService = updatedService.resolveCurrentIncident();

      if (openIncident) {
        const resolved = openIncident.resolve(now).incrementEmailsSent();
        await repositories.incidents.update(resolved);
        incident = resolved;

        notification = this.buildNotification(
          "incident-resolved",
          props,
          resolved.getProps().id,
          `[Resolved] Service "${props.name}" has recovered`,
          `Service "${props.name}" (${props.url}) has recovered from the incident.`,
        );
      }
    }

    return { updatedService, incident, notification };
  }

  private async handleFailure(
    repositories: UOW["repositories"],
    service: Service,
  ): Promise<{
    updatedService: Service;
    incident: Incident | null;
    notification: NotificationJobData | null;
  }> {
    const now = new Date();
    const props = service.getProps();

    let updatedService = service.recordFailure().markCheckedAt(now);
    let incident: Incident | null = null;
    let notification: NotificationJobData | null = null;

    const thresholdMet =
      updatedService.getProps().consecutivesIncidentDetectionFails >=
      props.incidentDetectionFails;

    if (thresholdMet && !props.currentIncidentId) {
      const newIncident = Incident.create({
        serviceId: props.id,
        startedAt: now,
      }).incrementEmailsSent();

      await repositories.incidents.create(newIncident);

      updatedService = updatedService
        .markIncident()
        .setCurrentIncident(newIncident.getProps().id);

      incident = newIncident;

      notification = this.buildNotification(
        "incident-started",
        props,
        newIncident.getProps().id,
        `[Incident] Service "${props.name}" is down`,
        `Service "${props.name}" (${props.url}) has been marked as incident after ${updatedService.getProps().consecutivesIncidentDetectionFails} consecutive failures.`,
      );
    } else if (!props.currentIncidentId) {
      updatedService = updatedService.markChecking();
    }

    return { updatedService, incident, notification };
  }

  private buildNotification(
    type: NotificationJobData["type"],
    serviceProps: ServiceType,
    incidentId: string,
    subject: string,
    body: string,
  ): NotificationJobData | null {
    if (!serviceProps.emailToAlert) return null;

    return {
      type,
      to: serviceProps.emailToAlert,
      subject,
      body,
      incidentId,
      serviceId: serviceProps.id,
    };
  }

  private async enqueueNotification(
    notification: NotificationJobData | null,
  ): Promise<void> {
    if (!notification) return;

    try {
      await this.notificationsProducer.enqueue(notification);
    } catch (error) {
      console.error(
        `[ExecuteHealthCheck] Failed to enqueue notification (type=${notification.type}, incidentId=${notification.incidentId}):`,
        error,
      );
    }
  }
}
