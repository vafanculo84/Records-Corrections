-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEAD_INSTRUCTOR', 'ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR', 'RECORDS', 'ADMIN');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('SUBMITTED', 'PENDING_APPROVAL', 'PENDING_LEAD_INSTRUCTOR_APPROVAL', 'PENDING_ASSISTANT_CHIEF_APPROVAL', 'PENDING_MULTIPLE_APPROVALS', 'APPROVED_PENDING_RECORDS', 'SENT_TO_RECORDS', 'PRINTED_BY_RECORDS', 'ENTERED_INTO_STUDENT_FILE', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceOfError" AS ENUM ('STUDENT_INSTRUCTOR', 'DATA_PROCESSOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SignerRole" AS ENUM ('CFI', 'LEAD_INSTRUCTOR', 'ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR', 'RECORDS', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "transaction_in_error" TEXT NOT NULL,
    "aircraft_registration" TEXT NOT NULL,
    "source_of_error" "SourceOfError" NOT NULL,
    "source_other_text" TEXT,
    "submitted_by_name" TEXT NOT NULL,
    "submitted_by_email" TEXT,
    "instructor_identifier" TEXT NOT NULL,
    "submitted_publicly" BOOLEAN NOT NULL DEFAULT true,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "current_assignee_user_id" TEXT,
    "current_assignee_role" "UserRole",
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_to_records_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_items" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "incorrect_item" TEXT NOT NULL,
    "custom_item_label" TEXT,
    "now_reads" TEXT,
    "should_read" TEXT NOT NULL,
    "remarks" TEXT,
    "requires_additional_signature" BOOLEAN NOT NULL DEFAULT false,
    "requires_documentation" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "user_id" TEXT,
    "signer_name" TEXT NOT NULL,
    "signer_identifier" TEXT,
    "signer_role" "SignerRole" NOT NULL,
    "signature_image_url" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signature_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "approver_user_id" TEXT,
    "approver_role" "UserRole" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "signature_required" BOOLEAN NOT NULL DEFAULT false,
    "comments_required" BOOLEAN NOT NULL DEFAULT false,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signature_id" TEXT,
    "acted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "correction_item" TEXT,
    "source_of_error" "SourceOfError",
    "instructor_identifier" TEXT,
    "required_role" "UserRole",
    "required_specific_user_id" TEXT,
    "signature_required" BOOLEAN NOT NULL DEFAULT false,
    "comments_required" BOOLEAN NOT NULL DEFAULT false,
    "send_to_records_after_approval" BOOLEAN NOT NULL DEFAULT true,
    "send_directly_to_records" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_configs" (
    "id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "requires_now_reads" BOOLEAN NOT NULL DEFAULT false,
    "requires_signature" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval_role" "UserRole",
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_field_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "records_actions" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "records_user_id" TEXT,
    "correction_performed_by_name" TEXT,
    "pdf_sent_at" TIMESTAMP(3),
    "printed_at" TIMESTAMP(3),
    "entered_into_file_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_role" "UserRole",
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT,
    "user_id" TEXT,
    "public_actor_name" TEXT,
    "public_actor_identifier" TEXT,
    "action" TEXT NOT NULL,
    "previous_status" "CorrectionStatus",
    "new_status" "CorrectionStatus",
    "comments" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "records_recipient_email" TEXT NOT NULL DEFAULT 'records@example.com',
    "approval_notifications" BOOLEAN NOT NULL DEFAULT true,
    "records_notifications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_counters" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_counters_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "correction_requests_request_number_key" ON "correction_requests"("request_number");

-- CreateIndex
CREATE INDEX "correction_requests_status_submitted_at_idx" ON "correction_requests"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "correction_requests_student_name_idx" ON "correction_requests"("student_name");

-- CreateIndex
CREATE INDEX "correction_requests_student_id_idx" ON "correction_requests"("student_id");

-- CreateIndex
CREATE INDEX "correction_requests_instructor_identifier_idx" ON "correction_requests"("instructor_identifier");

-- CreateIndex
CREATE INDEX "correction_requests_aircraft_registration_idx" ON "correction_requests"("aircraft_registration");

-- CreateIndex
CREATE INDEX "correction_items_incorrect_item_idx" ON "correction_items"("incorrect_item");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_signature_id_key" ON "approvals"("signature_id");

-- CreateIndex
CREATE INDEX "approvals_approver_role_status_idx" ON "approvals"("approver_role", "status");

-- CreateIndex
CREATE INDEX "approvals_approver_user_id_status_idx" ON "approvals"("approver_user_id", "status");

-- CreateIndex
CREATE INDEX "routing_rules_active_sort_order_idx" ON "routing_rules"("active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "form_field_configs_field_key_key" ON "form_field_configs"("field_key");

-- CreateIndex
CREATE UNIQUE INDEX "records_actions_correction_request_id_key" ON "records_actions"("correction_request_id");

-- CreateIndex
CREATE INDEX "audit_logs_correction_request_id_created_at_idx" ON "audit_logs"("correction_request_id", "created_at");

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_current_assignee_user_id_fkey" FOREIGN KEY ("current_assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_items" ADD CONSTRAINT "correction_items_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_signature_id_fkey" FOREIGN KEY ("signature_id") REFERENCES "signatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_required_specific_user_id_fkey" FOREIGN KEY ("required_specific_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records_actions" ADD CONSTRAINT "records_actions_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records_actions" ADD CONSTRAINT "records_actions_records_user_id_fkey" FOREIGN KEY ("records_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
