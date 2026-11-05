# ADR-008: Pluggable Provider Abstractions for Notification, AI, and Object Storage

## Status
Accepted

## Context
Third-party services (email gateways, cloud storage providers, LLM services) frequently change, evolve, or get replaced due to pricing, vendor lock-in, or deployment environment constraints.

## Decision
Isolate all third-party integrations in `backend/src/infrastructure/` behind strict service interfaces:
- `NotificationService` -> EmailProvider, SMSProvider, PushProvider, WhatsAppProvider
- `AIService` -> GeminiProvider, OpenAIProvider, LocalLLMProvider
- `StorageService` -> LocalStorageProvider, S3StorageProvider, AzureBlobStorageProvider

## Consequences
### Positive
- Zero business domain dependency on specific external SDKs or vendors.
- Seamless fallback and multi-provider switching via simple `.env` flags.
- Simplified unit and integration testing using mock providers.
