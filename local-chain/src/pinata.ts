import pinataSDK from '@pinata/sdk'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.PINATA_JWT_KEY) {
  throw new Error('PINATA_JWT_KEY is not set')
}

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT_KEY })

export async function pinataPinJSON(obj: any): Promise<string> {
  const result = await pinata.pinJSONToIPFS(obj, {
    pinataOptions: { cidVersion: 0 },
  })
  console.log(`Pinned JSON: ${result.IpfsHash}`)
  return result.IpfsHash
}
