## Platform Devices Service (NestJS)

Backend service built with NestJS for managing platform devices (such as soundboxes / IoT devices).  
It provides APIs for:

- **Device registry**: creating and managing device records
- **Device assignment**: linking devices to merchants / users / locations
- **Device configuration**: storing and updating device configuration
- **Device credentials**: managing secure credentials and secrets
- **Device connectivity**: integrating with MQTT / connectivity status APIs
- **Authentication & authorization**: JWT‑based auth with role‑based access
- **Observability**: OpenTelemetry traces/metrics and structured logging

The service uses PostgreSQL via TypeORM, runs behind a configurable API prefix, and can be exposed over HTTP or HTTPS with CORS controls.

---

## Tech stack

- **Runtime**: Node.js, TypeScript
- **Framework**: `@nestjs/core` (NestJS 11)
- **Database**: PostgreSQL via `typeorm` and `@nestjs/typeorm`
- **Authentication**: `passport`, `passport-jwt`, custom `AuthModule`
- **Config**: `@nestjs/config` with `.env` support
- **Background / worker**: Redis connection via `WORKER_HOST`
- **Observability**: OpenTelemetry (`@opentelemetry/*`), custom metrics service
- **Mail & notifications**: SMTP configuration via env vars
- **Device features**: `DeviceRegistryModule`, `DeviceAssignmentModule`, `DeviceConfigModule`, `DeviceCredentialModule`, `DeviceConnectivityModule`

---

## How the service is wired

- `src/main.ts`
  - Boots OpenTelemetry SDK.
  - Validates critical database env vars before startup.
  - Optionally starts HTTPS when `ENABLE_HTTPS=true` and `KEY_PATH` / `CERT_PATH` are provided.
  - Applies global CORS configuration when `CORS_ENABLED=true` and restricts origins to `WHITELIST_API`.
  - Sets a global API prefix from config (`API_PREFIX`, e.g. `/api`) and enables URI versioning.
  - Registers global validation + transform pipes, serialization options, and logging interceptors.
  - Registers global guards: `JwtAuthGuard` and `RolesGuard` for auth and RBAC.

- `src/app.module.ts`
  - Loads configuration from `.env` using `ConfigModule.forRoot` with `app.config` and `database.config`.
  - Configures PostgreSQL with `TypeOrmModule.forRootAsync` and a custom `TypeOrmConfigService`.
  - Wires the device‑related modules and `AuthModule` into the main application.

---

## Prerequisites

- **Node.js**: v20+ (recommended)  
- **npm**: v10+  
- **PostgreSQL**: running instance reachable from this service  
- **Redis**: if you use worker / queue features (`WORKER_HOST`)  
- **Optional** (depending on your use):
  - SMTP server for sending emails
  - MQTT infrastructure for device connectivity callbacks

---

## Configuration

### 1. Create your `.env`

Use the provided `env-example` as a starting point:

```bash
cp env-example .env
```

Then edit `.env` and at least review / set:

- **Application**
  - `NODE_ENV=development`
  - `APP_PORT=3000`
  - `APP_NAME="Soundbox Backend"`
  - `API_PREFIX=api` (final base path will be e.g. `http://localhost:3000/api`)

- **Database (PostgreSQL)**
  - `DATABASE_TYPE=postgres`
  - `DATABASE_HOST=localhost`
  - `DATABASE_PORT=5432`
  - `DATABASE_USERNAME=postgres`
  - `DATABASE_PASSWORD=postgres`
  - `DATABASE_NAME=proxgy`
  - `DATABASE_SYNCHRONIZE=false` (set `true` only for local dev/prototyping)

- **Authentication**
  - `AUTH_JWT_SECRET`
  - `AUTH_JWT_TOKEN_EXPIRES_IN`
  - `AUTH_REFRESH_SECRET`
  - `AUTH_REFRESH_TOKEN_EXPIRES_IN`
  - `SUPER_ADMIN_EMAIL`
  - `SUPER_ADMIN_PASSWORD`

- **Mail / notifications (optional)**
  - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`
  - `MAIL_DEFAULT_EMAIL`, `MAIL_DEFAULT_NAME`

- **Workers / queues (optional)**
  - `WORKER_HOST=redis://localhost:6379/0`

- **HTTPS (optional)**
  - `ENABLE_HTTPS=true|false`
  - `KEY_PATH=/path/to/key.pem`
  - `CERT_PATH=/path/to/cert.pem`

- **CORS**
  - `CORS_ENABLED=true|false`
  - `WHITELIST_API=http://127.0.0.1,http://localhost:3000` (comma‑separated list of allowed origins)

> **Note**: On startup, the app will validate the required database‑related env variables and exit with an error if any are missing or invalid.

---

## Install dependencies

From the project root:

```bash
npm install
```

This installs all runtime and dev dependencies defined in `package.json`.

---

## Running the service

### 1. Development (watch mode)

```bash
npm run start:dev
```

- Starts the NestJS app with file‑watching / auto‑reload.
- By default, the server listens on `APP_PORT` (e.g. `3000`) with the configured `API_PREFIX` (e.g. `api`):
  - **Base URL**: `http://localhost:3000/api`

### 2. Development (single run)

```bash
npm run start
```

Starts the NestJS application once without the file watcher.

### 3. Production build & run

```bash
npm run build
npm run start:prod
```

This compiles TypeScript to `dist/` and runs `node dist/main`.  
Use this flow when deploying to staging/production.

---

## Running tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

---

## Observability & logging

- **OpenTelemetry** is started as part of `bootstrap` in `src/main.ts`, enabling traces/metrics.
- **Axios trace interceptor** attaches trace context to outgoing HTTP calls for better tracking.
- **Custom logger & metrics** via `CustomLoggerService` and `OtelMetricsService` are wired into a global interceptor for execution logging.
- **Graceful shutdown**: on `SIGTERM`, the OTEL SDK is shut down cleanly before process exit.

Depending on your environment, you may point OTEL exporters to Prometheus, OTLP-compatible backends, etc., via their respective env vars (not shown exhaustively here).

---

## CORS & HTTPS behaviour

- When `CORS_ENABLED=true`, only origins whose base URL is present in `WHITELIST_API` are allowed.
- When `ENABLE_HTTPS=true` and valid `KEY_PATH` and `CERT_PATH` are configured, the service starts an HTTPS server with those certificates.

---

## Typical local workflow

1. **Clone** the repository.
2. **Copy env file**: `cp env-example .env` and customize values (DB, secrets, ports).
3. **Install deps**: `npm install`.
4. **Run DB migrations / prepare schema** (if applicable in your workflow).
5. **Start the service**: `npm run start:dev`.
6. Hit your APIs at `http://localhost:APP_PORT/API_PREFIX` (default `http://localhost:3000/api`). 

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
