import { Address, createPublicClient, http, namehash, parseAbi } from "viem";

const publicClient = createPublicClient({
  transport: http(process.env.PONDER_RPC_URL_1),
});

export function shortId(id: string): string {
  const lower = id.toLowerCase();
  return lower.substring(0, 6) + '...' + lower.substring(id.length - 4)
}
const ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

export async function getEnsName(address: Address): Promise<string | undefined> {
  const node = namehash(`${address.toLowerCase().substring(2)}.addr.reverse`);
  const resolverAddress = await publicClient.readContract({
    address: ensRegistryAddress,
    abi: parseAbi(['function resolver(bytes32 node) external view returns (address)']),
    functionName: 'resolver',
    args: [node],
  });

  if (resolverAddress === '0x0000000000000000000000000000000000000000') {
    return undefined;
  }

  const name = await publicClient.readContract({
    address: resolverAddress,
    abi: parseAbi(['function name(bytes32 node) external view returns (string)',]),
    functionName: 'name',
    args: [node],
  });
  return name;
}

export async function getEnsAvatar(name: string): Promise<string | undefined> {
  const url = `https://metadata.ens.domains/mainnet/avatar/${name}`;
  // try fetching the image
  try {
    const response = await fetch(url);
    if (response.status === 200) {
      return url;
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

export async function getEns(address: Address): Promise<{ name: string | undefined, image: string | undefined }> {
  const name = await getEnsName(address);
  let image = undefined;
  if (name) {
    image = await getEnsAvatar(name);
  }
  return { name, image };
}


export function getAbsoluteTripleId(vaultId: bigint): bigint {
  const max = (BigInt(2) ** BigInt(255) * BigInt(2) - BigInt(1)) / BigInt(2)
  const isCounterVault = max < BigInt(vaultId)
  let result = vaultId
  if (isCounterVault) {
    result = BigInt(2) ** BigInt(255) * BigInt(2) - BigInt(1) - BigInt(vaultId)
  }

  return result
}

export function hourId(timestamp: bigint): number {
  return Math.floor(parseInt(timestamp.toString()) / 3600) * 3600;
}
