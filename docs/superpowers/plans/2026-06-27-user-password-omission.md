# User Password Omission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the default domain `User` passwordless while keeping a password-bearing domain type for creation and authentication.

**Architecture:** Keep Prisma `users.password` required and keep the Prisma client default password omission. Split the domain user into `User` and `UserWithPassword`, then make repository methods return passwordless users unless the method name explicitly requests password data.

**Tech Stack:** TypeScript, Zod v4, Prisma, Vitest, Fastify route schemas.

## Global Constraints

- Run commands inside `backend/`.
- Use path aliases for cross-layer imports.
- Entity validation belongs in Zod schemas and entity specs.
- Use-case specs use `IMUOW` and test helpers.
- API route schemas must remain the single source of truth for request and response validation.
- Do not add backward compatibility code for the placeholder password workaround.

---

### Task 1: Split User Entity Shapes

**Files:**
- Modify: `backend/src/domain/entities/user.ts`
- Modify: `backend/src/domain/entities/user.spec.ts`

**Interfaces:**
- Produces: `UserSchema`, `UserWithPasswordSchema`, `User`, `UserWithPassword`, `CreateUserType`, `CreateUserWithPasswordType`

- [x] **Step 1: Write failing entity tests**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement entity split**
- [x] **Step 4: Run test to verify it passes**

---

### Task 2: Update Mappers and Repositories

**Files:**
- Modify: `backend/src/infra/mappers/user.ts`
- Modify: `backend/src/domain/repositories/interfaces/users.ts`
- Modify: `backend/src/infra/repositories/prisma/users.ts`
- Modify: `backend/src/domain/repositories/in-memory/users.ts`
- Modify: `backend/src/domain/use-cases/utils/tests/user.ts`

**Interfaces:**
- Consumes: `User`, `UserWithPassword`, `CreateUserWithPasswordType`
- Produces: `UsersRepInterface.create(data: UserWithPassword): Promise<User>` and `getByEmailWithPassword(email): Promise<UserWithPassword | null>`

- [x] **Step 1: Run type-check to expose dependent failures**
- [x] **Step 2: Update mapper imports and methods**
- [x] **Step 3: Update repository interfaces**
- [x] **Step 4: Update Prisma repository**
- [x] **Step 5: Update in-memory repository and test helpers**
- [x] **Step 6: Run type-check**

---

### Task 3: Update Use Cases and Schemas

**Files:**
- Modify: `backend/src/domain/use-cases/create-organization.ts`
- Modify: `backend/src/domain/use-cases/create-user-to-organization.ts`
- Modify: `backend/src/domain/use-cases/authenticate-user.ts`

**Interfaces:**
- Consumes: `UserWithPassword`, `UserWithPasswordSchema`, repository password-specific methods
- Produces: passwordless `AuthenticateUserOutputSchema`, `CreateOrganizationOutputSchema`, and `CreateUserToOrganizationOutputSchema`

- [x] **Step 1: Update create-user input schema**
- [x] **Step 2: Verify authenticate-user uses explicit password-bearing repository method**
- [x] **Step 3: Run targeted use-case tests**

---

### Task 4: Full Verification

**Files:**
- No source file changes expected.

**Interfaces:**
- Consumes: all completed tasks.
- Produces: verified implementation.

- [x] **Step 1: Run full test suite**
- [x] **Step 2: Run full type-check**
