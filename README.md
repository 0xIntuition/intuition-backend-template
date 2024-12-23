# Intuition backend template

![diagram-export-24-10-2024-11_37_18](https://github.com/user-attachments/assets/9602cb32-a4f7-4cd1-913a-b9973d9ef55c)



## Deploy to render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/0xIntuition/intuition-backend-template)

You will need to provide these secrets:

```
IPFS_GATEWAY_URL
PINATA_GATEWAY_TOKEN
PONDER_RPC_URL_1
PONDER_RPC_URL_8453
PONDER_RPC_URL_84532
```
After all services up and running, look up hasura admin secret in the render dashboard, and run this command

```
hasura metadata apply --project hasura --endpoint https://hasura-CHANGEME.onrender.com --admin-secret CHANGEME
hasura metadata ic drop --project hasura --endpoint https://hasura-CHANGEME.onrender.com --admin-secret CHANGEME
hasura migrate apply --project hasura --database-name ponder --endpoint https://hasura-CHANGEME.onrender.com --admin-secret CHANGEME
hasura metadata apply --project hasura --endpoint https://hasura-CHANGEME.onrender.com --admin-secret CHANGEME
```

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

