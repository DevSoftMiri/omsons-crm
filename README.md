# Omsons Glassware CRM

A scalable HubSpot-style CRM monorepo for Omsons Glassware, built with Next.js, NestJS, Prisma, PostgreSQL, Redis, BullMQ, and Turborepo.

## Structure

- `apps/web` - Next.js App Router frontend
- `apps/api` - NestJS backend API
- `packages/shared` - shared constants, types, and validators

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```
3. Start services:
   ```bash
   docker compose up -d
   ```
4. Generate Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. Start development:
   ```bash
   npm run dev
   ```

## Apps

- Web: http://localhost:3000
- API: http://localhost:4000/api

## Backend Capabilities

The API includes starter modules for auth, users, roles, permissions, leads, contacts, companies, dealers, pipelines, activities, notes, tasks, follow-ups, visits, dashboards, reports, notifications, integrations, files, audit logs, and settings.

Included foundations: JWT auth with refresh-token fields, RBAC decorators and guards, DTO validation, global exception filtering, pagination/search/filter/sort DTOs, Prisma service, audit logging service, and BullMQ queues for reminders.
