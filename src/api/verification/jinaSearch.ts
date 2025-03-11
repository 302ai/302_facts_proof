import ky from "ky";
import { env } from "@/env";
import { IParams } from ".";


interface IJina {
  "code": number,
  "status": number,
  "data": {
    "factuality": number,
    "result": boolean,
    "reason": string,
    "references": {
      "url": string,
      "keyQuote": string,
      "isSupportive": boolean
    }[]
  }
}

export const onJinaSearch = async (params: IParams & { claim: string, depthVerif: boolean }) => {
  const { claim, apiKey, depthVerif } = params;
  const result: IJina = await ky.get(`${env.NEXT_PUBLIC_API_URL}/jina/grounding/${encodeURIComponent(claim)}?deepdive=${depthVerif}`, {
    headers: {
      'Accept': 'application/json',
      "Authorization": `Bearer ${apiKey}`,
    },
    timeout: false
  }).then(res => res.json());
  return result.data;
}