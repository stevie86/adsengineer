# Feature Research

**Domain:** Self-hosted orchestrator and remote infrastructure management for hybrid architecture
**Researched:** 2026-01-26
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for self-hosted orchestrator capabilities. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Remote orchestration via webhooks | Standard pattern for self-hosted tasks (Orchestra docs) | MEDIUM | HTTP callbacks for status updates, outbound-only connectivity |
| Secure credential management | Enterprise requirement for self-hosted infrastructure | HIGH | Secrets never leave user's VPS, encrypted storage |
| Health monitoring and status reporting | Operators need visibility into distributed systems | MEDIUM | Telemetry without exposing sensitive data |
| Automated deployment scripts | Users expect one-click VPS setup | MEDIUM | Docker-compose or similar for easy deployment |
| Configuration management | Infrastructure as code expectations | MEDIUM | YAML/JSON configs for orchestrator behavior |
| Log aggregation and observability | Debugging distributed systems requires logs | HIGH | Redacted logs to central monitoring, raw logs local |
| Real-time status sync | Users need immediate feedback on deployments | MEDIUM | WebSocket or long-polling from orchestrator |
| Rollback capability | Deployments can fail, need safety net | HIGH | Must maintain previous versions |
| Secure tunnel setup | Zero-trust connectivity is non-negotiable | LOW | Cloudflare Tunnel provides this out-of-the-box |
| One-click worker deployment | Manual deployment defeats automation purpose | MEDIUM | Requires Workers API integration |

### Differentiators (Competitive Advantage)

Features that set AdsEngineer's hybrid architecture apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cloud-controlled customer-hosted execution | Keep sensitive data on-prem while leveraging cloud orchestration | HIGH | Follows Airbyte Enterprise Flex pattern |
| Outbound-only connectivity design | Eliminates inbound firewall rules, reduces attack surface | MEDIUM | Websockets/TLS from orchestrator to SaaS control plane |
| Regional execution plane distribution | Data sovereignty through architectural guarantees | HIGH | French data stays in France, Brazilian in Brazil |
| Unified codebase across environments | Feature parity without maintenance overhead | MEDIUM | Same binaries run cloud and on-prem |
| Hybrid control plane architecture | Central management with distributed execution | HIGH | SaaS coordinates, customer VPS executes |
| Immutable audit logs stored locally | Compliance-ready without vendor data exposure | MEDIUM | Customer owns audit trail for regulators |
| Local data processing | Sensitive data never leaves customer infrastructure | High | HIPAA/GDPR compliance advantage |
| Custom deployment logic | Business-specific deployment rules and approvals | Medium | Workflow engine in orchestrator |
| Hybrid deployment modes | Choose between edge-only or hybrid based on needs | Medium | Flexible architecture options |
| Advanced caching | Local asset caching + edge intelligence | High | Performance optimization |
| Multi-cloud support | Deploy to Workers + other providers from same interface | High | Future extensibility |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in self-hosted orchestrator context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Direct database access to orchestrator | Users want to query orchestration state | Breaks security model, creates attack surface | API-only access with proper authentication |
| Real-time bidirectional communication | Seems necessary for control | Requires inbound ports, complex networking | Outbound webhooks with polling for status |
| Shared credentials across environments | Simplifies configuration | Credential leakage risk, compliance violations | Per-environment credential isolation |
| Full-featured web UI on orchestrator | Users expect dashboard interface | Increases attack surface, maintenance burden | Lightweight status API, SaaS handles full UI |
| Auto-updating orchestrator binaries | Seems convenient for maintenance | Breaks trust model, unexpected changes | Manual update process with user approval |
| Direct peer-to-peer orchestrator communication | Seems efficient for distributed systems | Complex networking, security challenges | Hub-and-spoke via SaaS control plane |
| Public orchestrator endpoints | Security nightmare, attack surface | Exposes management to internet | Use Cloudflare Tunnel only |
| Direct database access from Workers | Breaks security model, couples systems | Creates tight coupling, security risks | Use API layer only |
| Manual worker management | Defeats automation purpose | Human error, inconsistent deployments | All operations via orchestrator API |
| Monolithic deployment bundles | Slow updates, inflexible | Large deployment windows, risk | Microservice-style worker modules |
| Synchronous deployment operations | Seems simpler for users | Timeouts, poor UX, resource waste | Async deployment with status callbacks |

## Feature Dependencies

```
[Secure Credential Management]
    └──requires──> [Automated Deployment Scripts]
                   └──requires──> [Configuration Management]

[Remote Orchestration via Webhooks]
    └──requires──> [Health Monitoring and Status Reporting]
                   └──requires──> [Log Aggregation and Observability]

[Cloud-Controlled Customer-Hosted Execution]
    └──requires──> [Outbound-Only Connectivity Design]
    └──enhances──> [Remote Orchestration via Webhooks]

[Regional Execution Plane Distribution]
    └──requires──> [Unified Codebase Across Environments]
    └──conflicts──> [Direct Peer-to-Peer Communication]

[Hybrid Control Plane Architecture]
    └──requires──> [Immutable Audit Logs Stored Locally]

Cloudflare Tunnel → Worker Deployment → Status Monitoring → Rollback Capability
        ↓                    ↓                     ↓
Configuration Management → Health Checks → Audit Logging
```

### Dependency Notes

- **Secure Credential Management requires Automated Deployment Scripts:** Initial setup must establish secure credential storage before any orchestration can begin
- **Cloud-Controlled Customer-Hosted Execution enhances Remote Orchestration:** The webhook pattern becomes the foundation for cloud control of customer-hosted workloads
- **Regional Execution Plane Distribution conflicts with Direct Peer-to-Peer Communication:** Geographic isolation prevents direct peer connections, requiring hub-and-spoke architecture
- **Hybrid Control Plane Architecture requires Immutable Audit Logs:** Compliance demands customer-owned audit trails when control is separated from execution

**Core dependencies:**
- Secure tunnel (Cloudflare Tunnel) required for any deployment
- Worker API authentication required before any operations
- Basic status monitoring prerequisite for rollback functionality
- Remote orchestration via webhooks foundation for all hybrid patterns

## MVP Definition

### Launch With (v1.0)

Minimum viable product for hybrid architecture milestone.

- [ ] **Remote Orchestration via Webhooks** — Core communication pattern for self-hosted execution
- [ ] **Secure Credential Management** — Enterprise requirement for secrets never leaving VPS
- [ ] **Automated Deployment Scripts** — One-click VPS setup for Clawdbot orchestrator
- [ ] **Health Monitoring and Status Reporting** — Basic visibility into distributed system state
- [ ] **Configuration Management** — YAML-based orchestrator configuration
- [ ] **Cloudflare Tunnel integration with Workers VPC** — Zero-trust connectivity foundation
- [ ] **Basic worker deployment API** — Core functionality for deploying Workers
- [ ] **Real-time deployment status via WebSocket** — User feedback loop
- [ ] **Rollback capability** — Safety net for failed deployments
- [ ] **Basic audit logging** — Compliance change tracking

### Add After Validation (v1.1)

Features to add once core hybrid architecture is working.

- [ ] **Outbound-Only Connectivity Design** — Enhanced security through websockets/TLS
- [ ] **Log Aggregation and Observability** — Redacted logs to SaaS, raw logs local
- [ ] **Immutable Audit Logs Stored Locally** — Compliance-ready audit trails

### Future Consideration (v1.2+)

Features to defer until hybrid architecture is validated.

- [ ] **Cloud-Controlled Customer-Hosted Execution** — Advanced orchestration patterns
- [ ] **Regional Execution Plane Distribution** — Multi-region data sovereignty
- [ ] **Unified Codebase Across Environments** — Feature parity across deployment models
- [ ] **Advanced caching** — Requires more complex infrastructure
- [ ] **Multi-cloud support** — Not needed for initial value proposition
- [ ] **Custom deployment logic** — Can be added later based on user feedback

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Remote Orchestration via Webhooks | HIGH | MEDIUM | P1 |
| Secure Credential Management | HIGH | HIGH | P1 |
| Automated Deployment Scripts | HIGH | MEDIUM | P1 |
| Health Monitoring and Status Reporting | MEDIUM | MEDIUM | P1 |
| Configuration Management | MEDIUM | LOW | P1 |
| Cloudflare Tunnel integration | HIGH | LOW | P1 |
| Basic worker deployment API | HIGH | MEDIUM | P1 |
| Real-time deployment status via WebSocket | MEDIUM | MEDIUM | P1 |
| Rollback capability | HIGH | HIGH | P1 |
| Basic audit logging | LOW | LOW | P1 |
| Outbound-Only Connectivity Design | MEDIUM | MEDIUM | P2 |
| Log Aggregation and Observability | MEDIUM | HIGH | P2 |
| Immutable Audit Logs Stored Locally | LOW | MEDIUM | P2 |
| Cloud-Controlled Customer-Hosted Execution | HIGH | HIGH | P3 |
| Regional Execution Plane Distribution | MEDIUM | HIGH | P3 |
| Unified Codebase Across Environments | LOW | MEDIUM | P3 |
| Advanced caching | HIGH | HIGH | P3 |
| Multi-cloud support | MEDIUM | HIGH | P3 |
| Custom deployment logic | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.0 hybrid architecture launch
- P2: Should have, add when possible (v1.1)
- P3: Nice to have, future consideration (v1.2+)

## Competitor Feature Analysis

| Feature | Airbyte Enterprise Flex | Orchestra Self-Hosted Tasks | Nomad | Our Approach |
|---------|------------------------|---------------------------|-------|--------------|
| Remote orchestration | ✓ (Hybrid control plane) | ✓ (Webhook API) | ✓ (Agent communication) | ✓ (Webhook-based with Cloudflare Workers) |
| Secure credential management | ✓ (External secrets) | ✓ (Customer-controlled) | ✓ (Vault integration) | ✓ (Doppler + local encryption) |
| Outbound-only connectivity | ✓ (TLS websockets) | ✓ (HTTP callbacks) | ✗ (Bidirectional) | ✓ (Cloudflare Workers pattern) |
| Regional distribution | ✓ (Multi-region) | ✗ (Single region) | ✓ (Federation) | Planned (v1.2+) |
| Unified codebase | ✓ (Same binaries) | ✗ (Different runtimes) | ✓ (Single binary) | ✓ (TypeScript unified runtime) |
| Compliance audit logs | ✓ (Customer-owned) | ✓ (Webhook logs) | ✓ (Local storage) | ✓ (Local + redacted central) |

## Hybrid Architecture Specific Features

### Orchestrator Core
| Feature | Description | Implementation Approach |
|---------|-------------|----------------------|
| Tunnel Management | Automatic Cloudflare Tunnel setup/renewal | Use cloudflared process with health checks |
| Worker Registry | Track deployed workers, versions, configurations | SQLite database with sync to D1 |
| Deployment Engine | Build and deploy Workers via API | Cloudflare Workers REST API with validation |
| Status Broadcast | Real-time deployment updates to dashboard | WebSocket server with authentication |
| Credential Vault | Encrypted storage for platform credentials | Local encryption + Doppler integration |

### Integration Layer
| Feature | Description | Implementation Approach |
|---------|-------------|----------------------|
| Service Discovery | Auto-discover Workers APIs | Workers VPC service bindings |
| Event Sourcing | Track all deployment events | Event store in SQLite + D1 sync |
| Configuration Sync | Bidirectional config consistency | Conflict resolution via timestamps |
| Health Bridge | Monitor both orchestrator and Workers | Periodic health checks with alerting |
| Webhook Gateway | Receive callbacks from self-hosted tasks | Secure HTTP endpoint with authentication |

### User Interface
| Feature | Description | Implementation Approach |
|---------|-------------|----------------------|
| Deployment Dashboard | Real-time deployment status and controls | React + WebSocket client |
| Configuration UI | Manage sites, environments, settings | Form-based interface with validation |
| Monitoring View | System health, logs, metrics | Charts + log streaming |
| Audit Trail | Compliance-focused change history | Tabular view with filtering |

## Sources

- **HIGH Confidence:** Context7 Kubernetes documentation, Airbyte cloud control plane patterns
- **MEDIUM Confidence:** Orchestra self-hosted tasks documentation, Ansible automation guides 2025
- **LOW Confidence:** Web search results for general orchestration patterns (require verification)

### Key References
- Orchestra Self-Hosted Tasks documentation: Webhook-based status communication pattern
- Airbyte Enterprise Flex: Cloud-controlled customer-hosted execution architecture
- Kubernetes Control Plane options: Self-hosted vs managed vs traditional deployment patterns
- HashiCorp Nomad: Distributed workload orchestration patterns
- Ansible automation guides 2025: VPS deployment and configuration management best practices
- Cloudflare Workers VPC documentation (production patterns)
- PM2 process management best practices
- Docker containerization for Node.js applications
- WebSocket real-time communication patterns
- SQLite vs PostgreSQL for local applications

---
*Feature research for: Self-hosted orchestrator and remote infrastructure management*
*Researched: 2026-01-26*