-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('ADMIN', 'DEV');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" "user_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "show_public_page" BOOLEAN NOT NULL,
    "public_page_slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "url" TEXT NOT NULL,
    "interval_seconds" INTEGER NOT NULL DEFAULT 60,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "expected_response_status" INTEGER NOT NULL DEFAULT 200,
    "incident_detection_fails" INTEGER NOT NULL DEFAULT 1,
    "consecutives_incident_detection_fails" INTEGER NOT NULL DEFAULT 0,
    "email_to_alert" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "current_incident_id" TEXT,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "request_time" INTEGER NOT NULL,
    "is_error" BOOLEAN NOT NULL,
    "timed_out" BOOLEAN NOT NULL,
    "response_status" INTEGER NOT NULL,
    "response_json_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "emails_sent" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_public_page_slug_key" ON "projects"("public_page_slug");

-- CreateIndex
CREATE INDEX "projects_organization_id_idx" ON "projects"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_name_key" ON "projects"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "services_current_incident_id_key" ON "services"("current_incident_id");

-- CreateIndex
CREATE INDEX "services_project_id_idx" ON "services"("project_id");

-- CreateIndex
CREATE INDEX "services_enabled_last_checked_at_idx" ON "services"("enabled", "last_checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "services_project_id_name_key" ON "services"("project_id", "name");

-- CreateIndex
CREATE INDEX "health_checks_service_id_idx" ON "health_checks"("service_id");

-- CreateIndex
CREATE INDEX "health_checks_created_at_idx" ON "health_checks"("created_at");

-- CreateIndex
CREATE INDEX "incidents_service_id_idx" ON "incidents"("service_id");

-- CreateIndex
CREATE INDEX "incidents_started_at_idx" ON "incidents"("started_at");

-- CreateIndex
CREATE INDEX "incidents_resolved_at_idx" ON "incidents"("resolved_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_current_incident_id_fkey" FOREIGN KEY ("current_incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
