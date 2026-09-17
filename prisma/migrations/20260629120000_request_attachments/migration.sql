-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('SUPPORTING_DOCUMENTATION_PHOTO');

-- CreateEnum
CREATE TYPE "UploadedByType" AS ENUM ('PUBLIC_CFI', 'INTERNAL_USER');

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "attachment_type" "AttachmentType" NOT NULL,
    "uploaded_by_type" "UploadedByType" NOT NULL,
    "uploaded_by_user_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_attachments_correction_request_id_idx" ON "request_attachments"("correction_request_id");

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
