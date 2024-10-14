# Intuition backend template

![diagram-export-02-10-2024-17_07_54](https://github.com/user-attachments/assets/0aa99e3d-f24a-45c5-ab2b-e2719e9bb902)



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

Configure hasura

```
cd ..
pnpm dev:hasura
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

