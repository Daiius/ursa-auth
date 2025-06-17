# UrsaAuth
![UrsaAuth icon](./icons/ursa-auth-icon.svg)

UrsaAuth is an authentication server for Web/Mobile Login and API server protection.

## config
`.ursa-auth.config.ts` is required for both client and server.

see `ursa-auth.config.type.ts` to define your config.

# How to setup test environment
you can test UrsaAuth by running 3 servers in your local environemnt.
- UrsaAuth server
- Next.js server (UrsaAuth login)
- API server (use UrsaAuth protection)

## install packages
run `pnpm install` in 3 locations
- repository root
- examples/next
- examples/api-server

## docker compose
you can start these servers by docker compose command.
```
docker compose up
```

- UrsaAuth server: localhost:4000
- Next.js: localhost:3000
- API server: localhost:5000

