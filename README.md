# Intuition backend template

![diagram-export-01-10-2024-18_33_32](https://github.com/user-attachments/assets/84cfdc7c-8a1e-4331-84b9-25337250ee8f)


Start postgres, hasura, pgweb

```
pnpm dev
```

Indexing

```
cd ponder
pnpm i
cp .env.example .env.local
```

Edit `.env.local`

Start indexing base mainnet

```
pnpm dev:mainnet
```

Open http://localhost:42069/graphql

Start custom resolvers

```
cd apollo
pnpm i
pnpm start
```

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

