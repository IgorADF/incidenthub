# User Password Omission Design

## Goal

Make the default domain `User` safe to pass around by omitting the password from its props. The password remains required in the database and is only loaded into a password-bearing domain type for flows that explicitly need it, such as authentication and persistence after user creation.

## Current Problem

The Prisma client globally omits `user.password` by default, which is correct for sensitive data. The current `User` entity still requires `password`, so normal user reads map omitted-password Prisma records into domain users by injecting the placeholder value `"thisisaoverridepassword"`. This keeps the entity valid but makes the domain model misleading and risks accidental misuse.

## Chosen Approach

Keep `users.password` as a required Prisma column. Split the domain model into two explicit shapes:

- `User`: default passwordless user, used by normal reads, API outputs, authorization checks, and non-auth use cases.
- `UserWithPassword`: password-bearing user, used only where the password hash is required.

This avoids nullable passwords and avoids making every consumer handle an optional sensitive field.

## Domain Model

`UserSchema` will remove `password` and represent the safe default user shape.

`UserWithPasswordSchema` will extend `UserSchema` with `password: Password`.

`User` and `UserWithPassword` will both extend `DefaultEntity`, expose `create` and `fromProps`, and use generated defaults the same way current entities do.

## Repository Contract

Normal repository methods return passwordless `User`:

- `getById(id): Promise<User | null>`
- `getByEmail(email): Promise<User | null>`
- `create(data: UserWithPassword): Promise<User>`

The password-specific method is explicit:

- `getByEmailWithPassword(email): Promise<UserWithPassword | null>`

This keeps password access opt-in and visible at call sites.

## Mapper Behavior

`UserMapper.fromPrismaToEntity` maps omitted-password Prisma records into `User` without placeholder data.

`UserMapper.fromPrismaToEntityWithPassword` maps password-included Prisma records into `UserWithPassword`.

`UserMapper.fromEntityWithPasswordToPrisma` maps `UserWithPassword` into the Prisma create payload.

There is no mapper path that adds fake password data.

## Use Cases

`CreateUserToOrganization` hashes the submitted password, builds `UserWithPassword`, persists it, and returns a passwordless `User` output.

`AuthenticateUser` uses `getByEmailWithPassword`, compares the submitted password with the stored hash, and returns the passwordless output schema.

`ForgotPassword` and authorization-related flows continue using passwordless `User` instances.

## API Behavior

API response schemas continue to omit `password`. This design makes that omission natural because use cases generally return passwordless users before the API layer serializes anything.

## Testing

Entity tests should cover both shapes:

- `User.create` accepts valid passwordless props and has no password field.
- `UserWithPassword.create` validates password boundaries through the existing `Password` value object.

Use-case and e2e tests should continue asserting that auth and user creation responses do not expose `password`.

## Verification

Run targeted tests first:

```bash
npx vitest run src/domain/entities/user.spec.ts
npx vitest run src/domain/use-cases/authenticate-user.spec.ts src/domain/use-cases/create-user-to-organization.spec.ts
```

Then run full verification:

```bash
npx vitest run
npx tsc --noEmit
```
