# Infra for local development


## Install

Requires [docker](https://www.docker.com) and [pnpm](https://pnpm.io)

Also you have to checkout and build [0xIntuition/intuition-ts](https://github.com/0xIntuition/intuition-ts) in a parent directory

```
pnpm i
```

Setup local environment vars, by copying `.env.example` to `.env`

## Common usage

```
pnpm dev
```

This (re)starts local `geth` and `ipfs` nodes using docker compose, deploys multivault contract, initializes it with default configuration and creates supported predicate atoms

## Usage

`pnpm start` - start local `geth` and `ipfs` nodes using docker compose


`pnpm stop` - stop local nodes and remove attached volumes


`pnpm create-predicates` - deploys multivault contract, initializes it with default configuration and creates supported predicate atoms

