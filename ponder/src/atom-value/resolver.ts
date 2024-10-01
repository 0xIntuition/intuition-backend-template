import { Context, Schema } from "@/generated";
import { fetchFileFromIPFS } from "./ipfs";
import { resolveSchemaOrgProperties } from "./schema.org";

export async function resolveAtomData(context: Context, atom: Schema["Atom"]) {

  let data = atom.data;

  // Fetch data from IPFS if the URI is an IPFS URI
  if (atom.data.startsWith('ipfs://')) {
    const cid = atom.data.slice(7)
    try {
      data = await fetchFileFromIPFS(cid)
      // remove UTF-8 Byte Order Mark (BOM) anywhere in the string
      data = data.replace(/\uFEFF/, '')
    } catch (e) {
      // ignore
    }
  }

  let obj;
  // Try to parse the data as JSON
  try {
    obj = JSON.parse(data)
  } catch (e) {
    // ignore
  }

  if (obj) {
    if (
      obj['@context'] === 'https://schema.org'
      || obj['@context'] === 'https://schema.org/'
      || obj['@context'] === 'http://schema.org'
      || obj['@context'] === 'http://schema.org/'
    ) {
      await resolveSchemaOrgProperties(context, atom, obj)
    }
  }

}


