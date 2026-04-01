CREATE TABLE `outreach_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`status` enum('none','contacted','in_progress','complete') NOT NULL DEFAULT 'none',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outreach_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `outreach_statuses_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `property_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`memberId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `property_assignments_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `property_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`noteText` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `property_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `property_notes_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
