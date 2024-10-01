# Intuition backend template

Start postgres, hasura, pgweb

```
pnpm dev
```

Indexing

```
cd ponder
pnpm i
```

Start indexing base mainnet

```
pnpm dev:mainnet
```

Open http://localhost:42069/graphql


Configure hasura
```
cd ..
pnpm hasura-local:apply
```

Open http://localhost:8080/


## Local chain

Start local geth, depoy contract, create predicates

```
cd local-chain
pnpm dev
```

### Indexing local chain

```
cd ponder
pnpm dev
```

