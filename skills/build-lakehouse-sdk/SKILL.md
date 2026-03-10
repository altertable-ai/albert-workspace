---
name: build-lakehouse-sdk
description: Defines how to build a production-grade open-source Altertable Lakehouse API client in any programming language. Use when implementing or maintaining a Lakehouse SDK from the OpenAPI spec, including typed models, streaming query parsing, auth, and retries.
---

# Build Lakehouse Client SDK Skill

## Purpose

Use this skill to implement a language-idiomatic, strongly typed (or as strongly typed as idiomatic for the target language—best effort for dynamic or scripting languages), open-source client for the Altertable Lakehouse API.

Primary OpenAPI specification reference: `https://api.altertable.ai/openapi/lakehouse.json`

## Repo Setup

**Before starting implementation:**

- **If initializing a new SDK repo or updating to a new spec version**: Use [`bootstrap-sdk`](../bootstrap-sdk/SKILL.md) first to fork the target repository, clone it, set up/update the `specs` submodule (from `altertable-api-specs`), and create a branch. Then return here to continue with the implementation phases below.

- **If already working inside an existing repo checkout**: Skip to [Implementation Workflow](#implementation-workflow) and proceed with the phases.

## Required Outcomes

1. Full endpoint coverage (`append`, `query` — both streamed and accumulated —, `query/:query_id` GET/DELETE, `upload`, `validate`).
2. Package is publishable to the target language's primary registry.
3. Typed models and typed errors are first-class.
4. `/query` exposes both streamed (with metadata, columns, and row iterator) and accumulated (with all rows) versions.
5. Tests provide confidence in real runtime behavior.
6. Project is modern OSS with MIT licensing.

## Input Contract

Before implementation, collect or infer:

- Target language/runtime/version
- Package name and namespace
- Sync vs async style based on language best practices
- CI target versions
- Optional live-test credentials/settings

If these are not provided, choose ecosystem-standard defaults and document them.

## Implementation Workflow

Follow these phases in order.

### Phase 1: Scaffold

1. Create package/module scaffold with idiomatic structure.
2. Add MIT license.
3. Add README, changelog, and contribution docs.
4. Configure lint/typecheck/test scripts.
5. Generate a comprehensive `.gitignore` using `https://www.toptal.com/developers/gitignore/api/{language}` as a reference.

### Phase 2: Models and Serialization

1. Generate or define request/response models from OpenAPI.
2. Preserve enums and nullable semantics:
   - `ComputeSize`: `S | M | L`
   - `UploadFormat`: `csv | json | parquet`
   - `UploadMode`: `create | append | upsert | overwrite`
3. Preserve `oneOf` behavior for `AppendRequest`:
   - `{ Single: AppendPayload }` OR
   - `{ Batch: AppendPayload[] }`

### Phase 3: Client Core

Implement a configurable client constructor/factory with:

- `baseUrl` (default `https://api.altertable.ai`)
- auth options (see Authentication)
- timeout configuration
- retry policy
- optional user-agent suffix

### Phase 4: Endpoint Methods

Implement typed methods for all operations:

1. `append`

   - `POST /append`
   - required query params: `catalog`, `schema`, `table`
   - JSON request body: `AppendRequest`
   - typed response: `AppendResponse`

2. `query`

   Two versions must be provided:

   a. `query` (streamed)

   - `POST /query`
   - JSON body: `QueryRequest` (must include `statement`)
   - content type: `application/x-ndjson`
   - returns a structured result containing:
     - metadata
     - columns
     - an enumerator/iterator/async iterator/observable/channel to iterate over streamed rows

   b. `queryAll` (or `query_all`, accumulated)

   - `POST /query`
   - JSON body: `QueryRequest` (must include `statement`)
   - accumulates all rows from the stream before returning
   - returns a structured result containing:
     - metadata
     - columns
     - all rows as an array/list/collection

3. `upload`

   - `POST /upload`
   - required query params: `catalog`, `schema`, `table`, `format`, `mode`
   - conditional param: `primary_key` is required when `mode=upsert`
   - body: `application/octet-stream` bytes or stream

4. `getQuery` (or `get_query`)

   - `GET /query/{query_id}`
   - path param: `query_id` (UUID)
   - typed response: `QueryLogResponse`
   - returns query log information including stats, progress, duration, error

5. `cancelQuery` (or `cancel_query`)

   - `DELETE /query/{query_id}`
   - path param: `query_id` (UUID)
   - required query param: `session_id`
   - typed response: `CancelQueryResponse`
   - cancels a running query

6. `validate`
   - `POST /validate`
   - JSON body: `ValidateRequest` (must include `statement`)
   - typed response: `ValidateResponse`

### Phase 5: Streaming Contract (`query`)

The streamed `query` method must parse the NDJSON response and return a structured result with:

1. **metadata** - Query metadata (parsed from initial metadata line)
2. **columns** - Column schema information (parsed when schema row appears)
3. **rows iterator** - An enumerator/iterator/async iterator/observable/channel to iterate over streamed rows

The accumulated `queryAll` method should:

- Call `query` with the same request and accumulate the rows into a single array/list/collection
- Return metadata, columns, and all rows

Requirements:

- Include line index/context in parsing failures.
- Never silently ignore malformed lines.
- Preserve backpressure semantics of the language runtime (for streamed version).

### Phase 6: Authentication

The Altertable Lakehouse API uses standard HTTP Basic Auth. Credentials are sent in every request as:

```
Authorization: Basic <base64(username:password)>
```

The client must support all of the following credential input patterns:

1. **Direct credentials** — `username` + `password` accepted in the client constructor/config; the SDK encodes them into the Basic token internally.
2. **Pre-encoded token** — accept a raw pre-encoded `Basic` token string directly for callers who already hold the encoded value.
3. **Environment variable discovery** — auto-discover from the environment:
   - `ALTERTABLE_USERNAME` + `ALTERTABLE_PASSWORD` (encode on the fly), or
   - `ALTERTABLE_BASIC_AUTH_TOKEN` (use directly as the pre-encoded value)

Implementation requirements:

- Credentials must never appear in logs, error messages, or debug output.
- A `ConfigurationError` must be raised at construction time when no credentials can be resolved.

### Phase 7: Error Model

Implement a typed error hierarchy at minimum:

- `AuthError`
- `BadRequestError`
- `NetworkError`
- `TimeoutError`
- `SerializationError`
- `ParseError`
- `ApiError` (unexpected status fallback)
- `ConfigurationError`

All errors should include, when available:

- operation name
- HTTP method/path
- status code
- retriable flag/classification
- request/correlation id headers
- underlying cause

### Phase 8: Transport and Reliability

**For HTTP client performance best practices**, including keep-alive, timeout defaults, and language-specific HTTP client recommendations, read and follow the [Build HTTP SDK Skill](../build-http-sdk/SKILL.md).

### Phase 9: Testing

Implement layered tests:

1. Unit tests

   - model serialization
   - request construction
   - auth behavior and redaction
   - retries/timeouts
   - input precondition checks

2. Integration tests — run against `ghcr.io/altertable-ai/altertable-mock:latest`

   The mock server speaks the full Altertable Lakehouse API. Credentials are configured via the `ALTERTABLE_MOCK_USERS` environment variable, server listens on port `15000`.

   Use a **dual-mode** approach so tests always run — both locally and in CI — without real credentials:

   **In CI (GitHub Actions):** declare the mock as a service container so it is pre-bound to `localhost:15000` before the test step starts:

   ```yaml
   services:
     altertable:
       image: ghcr.io/altertable-ai/altertable-mock:latest
       ports:
         - 15000:15000
       env:
         ALTERTABLE_MOCK_USERS: testuser:testpass
       options: >-
         --health-cmd "exit 0"
         --health-interval 5s
         --health-timeout 3s
         --health-retries 3
         --health-start-period 10s
   ```

   **Outside CI (local development):** use the language-native Testcontainers library to pull and start the mock automatically before the test suite, store the mapped port in an environment variable (e.g. `ALTERTABLE_MOCK_PORT`), and stop the container via an `at_exit` / teardown hook. Skip this step when the `CI` environment variable is set.

   The test base URL is always `http://localhost:${ALTERTABLE_MOCK_PORT:-15000}`. Point every test client instance at this URL.

   Cover at minimum:

   - one streamed `query` call verifying metadata, columns, and row iteration
   - one `queryAll` call verifying all rows are accumulated
   - one `getQuery` call verifying the query log response
   - one `cancelQuery` call verifying the cancellation response
   - one `upload` call (CSV or JSON payload)
   - one `validate` call
   - one `append` call

CI should always run lint + typecheck + unit + integration tests (mock-backed). No test should be skipped due to missing credentials.

### Phase 10: Packaging and Release

Follow the [release-sdk](../release-sdk/SKILL.md) skill for versioning, naming, changelog format, CI/CD, and registry publishing conventions.

Additionally for this SDK:

1. Include examples for all endpoints (`append`, `query`, `queryAll`, `getQuery`, `cancelQuery`, `upload`, `validate`) in the README.
2. Verify docs match runtime behavior.

## Endpoint Reference (Minimal)

### `POST /append`

- Query: `catalog`, `schema`, `table`
- Body: `AppendRequest`
- Response: `AppendResponse { ok: boolean, error_code?: "invalid-data" | null }`

### `POST /query`

- Body: `QueryRequest`
- Response: NDJSON stream
- Key request fields:
  - required: `statement`
  - optional: `catalog`, `schema`, `session_id`, `compute_size`, `sanitize`, `limit`, `offset`, `timezone`, `ephemeral`, `visible`, `requested_by`, `query_id`

### `POST /upload`

- Query: `catalog`, `schema`, `table`, `format`, `mode`, optional `primary_key`
- Constraint: `primary_key` required for `mode=upsert`
- Body: binary file content

### `GET /query/{query_id}`

- Path: `query_id` (UUID)
- Response: `QueryLogResponse` containing query log information
- Returns: query metadata including `uuid`, `start_time`, `end_time`, `duration_ms`, `query`, `session_id`, `client_interface`, `error`, `stats` (with `caching`, `memory`, `scan`), `progress`, `visible`, `requested_by`, `user_agent`
- Status codes: 200 (success), 401 (auth required), 404 (query not found)

### `DELETE /query/{query_id}`

- Path: `query_id` (UUID)
- Query: `session_id` (required)
- Response: `CancelQueryResponse` with `cancelled` (boolean) and `message` (string)
- Status codes: 200 (success), 400 (invalid request), 401 (auth required), 404 (session not found)
- Cancels a running query associated with the given session

### `POST /validate`

- Body: `ValidateRequest` with required `statement`
- Response: `ValidateResponse` with `valid`, `statement`, `connections_errors`, optional `error`

## Acceptance Checklist

Only mark implementation complete when all are true:

- [ ] All 6 endpoints implemented and documented (`append`, `query` (streamed and accumulated), `getQuery`, `cancelQuery`, `upload`, `validate`)
- [ ] Streamed `query` returns metadata, columns, and row iterator; accumulated `queryAll` returns metadata, columns, and all rows
- [ ] Typed errors are comprehensive and actionable
- [ ] Auth supports direct/env/provider patterns
- [ ] Retries/timeouts/transport hooks are configurable
- [ ] Tests provide real-world confidence via the mock server (runs in both CI and local dev)
- [ ] Package is publish-ready for primary registry
- [ ] MIT license and OSS docs are present

## When Things Go Wrong

### OpenAPI spec unavailable

If the spec at `https://api.altertable.ai/openapi/lakehouse.json` cannot be fetched (timeout, 404, etc.), use the endpoint reference in this skill as the source of truth for models. Document which spec version you based the models on.

### Streaming parse failures

If NDJSON streaming produces unexpected line formats, fail loudly with line index and raw content in the error. Never silently drop rows.

### Tests cannot run

Integration tests use the mock server and require no live credentials, so they should always run. If the test phase is still blocked (e.g., Docker unavailable in the runner, missing native Testcontainers bindings), skip with a clear `TODO` and a logged warning — do not silently omit test coverage. Document what is skipped and why in the PR description.
