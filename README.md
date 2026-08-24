# Blog API — Authentication & Authorization

A blogging REST API built with Express, TypeScript and Prisma, where the main subject is access control: who is allowed to read, write, edit and delete what. Posts, categories, tags and comments sit on top of a JWT auth layer with ownership checks.

## Stack

TypeScript · Express 4 · Prisma ORM 5 · PostgreSQL · jsonwebtoken · bcrypt · CORS

## Authentication

Signup hashes the password with bcrypt before it ever reaches the database. Login returns two tokens:

- an **access token**, short-lived, sent on every request
- a **refresh token**, longer-lived, used only to obtain a new access token

The two are signed with **separate secrets** (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`) and have independently configurable lifetimes (`ACCESS_TOKEN_LIFE` / `REFRESH_TOKEN_LIFE`). Separate secrets matter: if the access secret is ever exposed, an attacker can forge a token that dies in fifteen minutes, but cannot mint refresh tokens and hold a session open indefinitely.

`AuthMiddleware` verifies the access token, resolves the user, and attaches it to the request. Protected routes mount it; public read endpoints do not.

## Authorization

Authentication answers *who are you*; this layer answers *is this yours*. Before a post is updated or deleted, the controller loads the record and compares `post.user_id` against the authenticated user. If they differ and the user has no moderator or admin role, the request is rejected with a 403 rather than silently doing nothing.

The comparison is made against the row **loaded from the database**, never against an id sent in the request body — so a user cannot edit someone else's post by supplying a different `user_id`. Moderators and admins bypass the ownership check but still have to pass authentication.

Deletes are soft: `remove` sets `deleted_at` instead of dropping the row, and every read filters on `deleted_at: null`. A post that gets deleted by mistake is recoverable, and comments that referenced it do not end up pointing at nothing.

## Resources

| Resource | Notes |
|---|---|
| Users | Signup, login, refresh, profile |
| Posts | CRUD, owned by an author |
| Categories | A post belongs to a category |
| Tags | Many-to-many with posts, via `PostTagController` |
| Comments | Owned by their author, attached to a post |

## Getting started

**Requirements:** Node.js 18+, PostgreSQL 14+

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and both JWT secrets
npx prisma migrate dev
npm run dev
```

### Environment variables

| Variable | Example |
|---|---|
| `PORT` | `3001` |
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/blog` |
| `JWT_ACCESS_SECRET` | generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | generate separately — must differ |
| `ACCESS_TOKEN_LIFE` | `15m` |
| `REFRESH_TOKEN_LIFE` | `7d` |

Secrets are never committed. `.env.example` documents the required keys; real values stay local.

## Project structure

```
src/
├── routes/        # postRoutes, categoryRoutes, TagRoutes, commentRoutes
├── controllers/   # Auth, User, Post, Category, Tag, PostTag, Comment
├── services/      # Prisma queries and business logic
├── middleware/    # AuthMiddleware — JWT verification
├── utils/         # Prisma client singleton
└── types/
prisma/
├── schema.prisma
└── migrations/
```

## Notes

Three things I would change:

- The ownership checks live in the controllers. They work, but every controller repeats the same load-then-compare block, so a new endpoint can forget it and nothing will complain. Moving the check into the service — or into a middleware that takes the resource type — would make it structural instead of a habit. This is the pattern I used in my NestJS e-commerce project, where a guard resolves a permission key per endpoint.
- Refresh tokens are not stored, so they cannot be revoked on logout. A valid refresh token stays valid until it expires. Persisting a hash of it would fix that.
- There are no automated tests. The ownership rules are exactly the kind of logic that is easy to break in a refactor and hard to notice by hand.

Built as part of an 8-month backend development program.

## Notes

Next steps I would take: store refresh tokens hashed in the database so they can be revoked on logout (right now a valid refresh token stays valid until it expires), and add integration tests covering the ownership rules — those are exactly the checks that are easy to break in a refactor and hard to notice by hand.

Built as part of an 8-month backend development program.
