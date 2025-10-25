CREATE TABLE "booking" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tenantId" varchar(255) NOT NULL,
	"customerId" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(500),
	"date" timestamp NOT NULL,
	"status" varchar(50) NOT NULL,
	"price" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tenantId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_booking_tenant_id" ON "booking" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_booking_customer_id" ON "booking" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "idx_booking_date" ON "booking" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_booking_tenant_id_date" ON "booking" USING btree ("tenantId","date");--> statement-breakpoint
CREATE INDEX "idx_booking_tenant_id_status_date" ON "booking" USING btree ("tenantId","status","date");--> statement-breakpoint
CREATE INDEX "idx_booking_status_date" ON "booking" USING btree ("status","date");--> statement-breakpoint
CREATE INDEX "idx_booking_customer_id_date" ON "booking" USING btree ("customerId","date");--> statement-breakpoint
CREATE INDEX "idx_booking_created_at" ON "booking" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_booking_tenant_id_created_at" ON "booking" USING btree ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_booking_tenant_date_status_covering" ON "booking" USING btree ("tenantId","date","status","customerId");--> statement-breakpoint
CREATE INDEX "idx_customer_tenant_id" ON "customer" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_customer_email" ON "customer" USING btree ("email");