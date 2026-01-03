# Data Model: Landing Page

## Entities

### Lead (Waitlist)
Minimal data capture for the waitlist form.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email format |
| source | string | No | UTM parameter or "web" default |
| created_at | timestamp | Yes | Submission time |

### LinkedIn Prospect
Manual tracking schema for outreach.

| Field | Type | Description |
|-------|------|-------------|
| Name | string | Prospect Name |
| Role | string | "Owner", "Founder", "Director" |
| Company | string | Agency Name |
| Status | enum | "Identified", "Connected", "Messaged", "Booked", "Lost" |
| Notes | text | Context for personalization |
