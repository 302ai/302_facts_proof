import { onExaSearch } from "./exaSearch"
import { onJinaSearch } from "./jinaSearch"
import { onVerifyclaims } from "./verifyclaims"
import { IClaim, IJinaClaim } from "../indexDB"
import { onExtractclaims } from "./extractclaims"

export interface IParams {
    apiKey: string; modelId: string; content: string
}

export async function onVerification(
    params: IParams & { verifyParams: { exa: boolean; jina: boolean; depthVerif: boolean } },
    onResult: (data: { exaFinalResults?: IClaim, jinaFinalResults?: IJinaClaim }) => void,
    onStop: (error?: any) => void,
) {
    try {
        const result = await onExtractclaims(params) as { claims: IClaim[], error: any };
        if (result && Array.isArray(result?.claims)) {
            const uniqueArray = Array.from(
                result.claims.reduce((map, item) => {
                    if (!map.has(item.original_text)) {
                        map.set(item.original_text, item);
                    }
                    return map;
                }, new Map())
                    .values()
            );
            let errorMes = null;
            if (params.verifyParams.exa) {
                for (let index = 0; index < uniqueArray.length; index++) {
                    try {
                        const element = result.claims[index];
                        const exaSources = await onExaSearch({ ...params, claim: element.claim });
                        if (exaSources?.results?.length) {
                            const sourceUrls = exaSources.results.map((result: { url: any; title: string }) => ({ url: result.url, title: result.title }));
                            const verifiedClaim = await onVerifyclaims({ ...params, claim: element.claim, original_text: element.original_text, sources: exaSources.results });
                            if (verifiedClaim?.error) {
                                errorMes = verifiedClaim;
                                break;
                            }
                            const data = { ...element, ...verifiedClaim, url_sources: sourceUrls, type: 'Exa' };
                            onResult({ exaFinalResults: data });
                        }
                    } catch (error: any) {
                        if (error.response) {
                            try {
                                const errorData = await error.response.json();
                                if (errorData?.error.err_code) {
                                    errorMes = errorData;
                                    break;
                                }
                            } catch (parseError) { }
                        }
                    }
                }
            }
            if (params.verifyParams.jina) {
                for (let index = 0; index < result.claims.length; index++) {
                    try {
                        const element = result.claims[index];
                        const jinaSources = await onJinaSearch({ ...params, claim: element.claim, depthVerif: params.verifyParams.depthVerif });
                        onResult({ jinaFinalResults: { ...jinaSources, ...element } });
                    } catch (error: any) {
                        if (error.response) {
                            try {
                                const errorData = await error.response.json();
                                if (errorData?.error.err_code) {
                                    errorMes = errorData;
                                    break;
                                }
                            } catch (parseError) { }
                        }
                    }
                }
            }
            onStop(errorMes);
        } else if (result?.error) {
            onStop({ error: result?.error })
        }
    } catch (error: any) {
        try {
            let errorMessage = error?.responseBody || error?.message || JSON.stringify(error);
            console.log('errorMessage', errorMessage);

            while (errorMessage.startsWith('Error: ')) {
                errorMessage = errorMessage.slice('Error: '.length);
            }
            const errorData = JSON.parse(errorMessage);
            onStop(errorData)
        } catch (parseError) {
            onStop({
                error: {
                    message: error.message || 'Unknown error',
                    raw: error
                }
            })
        }
    }
}
