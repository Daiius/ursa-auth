# UrsaAuth
![UrsaAuth icon](./icons/ursa-auth-icon.svg)

UrsaAuth is an authentication server for Web/Mobile Login and API server protection.

# How to setup test environment
you can test UrsaAuth function by running 3 servers in your local environemnt.
## 1. Start UrsaAuth server
(Assuming you are at repository root dir...)
```
pnpm install
pnpm dev
```
## 2. Start Next.js test web application
(Assuming you are at repository root dir...)
```
cd examples/next
pnpm install
pnpm dev
```
## 3. Start API server
(Assuming you are at repository root dir...)
```
cd examples/api-server
pnpm install
pnpm dev
```

