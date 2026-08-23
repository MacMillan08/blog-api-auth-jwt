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

Authentication answers *who are you*; this layer answers *is this yours*. Write operations check ownership before touching a row — an author can edit or delete their own post and their own comments, and nobody else's. Role checks are layered on top for administrative actions.

The check happens in the service layer against the record actually loaded from the database, not against an ID passed in by the client. A user cannot edit someone else's post by sending a different `authorId` in the body.

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
├── services/      # business logic and ownership checks
├── middleware/    # AuthMiddleware — JWT verification
├── utils/         # Prisma client singleton
└── types/
prisma/
├── schema.prisma
└── migrations/
```

## Notes

Next steps I would take: store refresh tokens hashed in the database so they can be revoked on logout (right now a valid refresh token stays valid until it expires), and add integration tests covering the ownership rules — those are exactly the checks that are easy to break in a refactor and hard to notice by hand.

Built as part of an 8-month backend development program.
