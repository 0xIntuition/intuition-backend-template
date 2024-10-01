if (!process.env.IPFS_GATEWAY_URL) {
  throw new Error('IPFS_GATEWAY_URL is not set');
}

if (!process.env.PINATA_GATEWAY_TOKEN) {
  throw new Error('PINATA_GATEWAY_TOKEN is not set');
}

export async function fetchFileFromIPFS(cid: string) {
  const url = `${process.env.IPFS_GATEWAY_URL}/ipfs/${cid}`;
  const timeout = 5000;
  const controller = new AbortController();
  const signal = controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(
      url,
      {
        headers: new Headers({
          'x-pinata-gateway-token': process.env.PINATA_GATEWAY_TOKEN as string
        }),
        signal
      }
    );
    clearTimeout(timeoutId);
    const text = await response.text();
    return text;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }

}

