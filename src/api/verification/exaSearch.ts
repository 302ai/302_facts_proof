import { SearchResponse } from "exa-js";
import { env } from '@/env';
import { IParams } from '.';
import ky from "ky";

export async function onExaSearch(params: IParams & { claim: string }) {
  const { claim, apiKey } = params;
  const result: SearchResponse<{}> = await ky.post(`${env.NEXT_PUBLIC_API_URL}/exaai/search`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: `${claim} \n\nHere is a web page to help verify this content:`,
      type: "auto",
      numResults: 3,
      livecrawl: 'always',
      contents: {
        text: true,
      }
    }),
    timeout: false,
  }).then(res => res.json())
  const simplifiedResults = result.results.map((item: any) => ({
    text: item.text,
    title:item.title,
    url: item.url
  })).reverse();
  return { results: simplifiedResults };
}