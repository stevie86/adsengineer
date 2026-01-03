CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('pipeline','in_negotiation','active','inactive') NOT NULL DEFAULT 'pipeline',
	`monthlyRecurringRevenue` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fixedCosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('business','private') NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixedCosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roiParameters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthlyRevenue` int NOT NULL DEFAULT 40000,
	`monthlyAdBudget` int NOT NULL DEFAULT 15000,
	`lossScenarioMin` int NOT NULL DEFAULT 20,
	`lossScenarioMax` int NOT NULL DEFAULT 35,
	`adsEngineerFee` int NOT NULL DEFAULT 50000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roiParameters_id` PRIMARY KEY(`id`)
);
