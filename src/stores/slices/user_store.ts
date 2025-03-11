import { IClaim, IJinaClaim } from "@/api/indexDB";
import { atomWithStorage, createJSONStorage } from "jotai/utils";


export type UserConfigState = {
    verifyParams: {
        exa: boolean;
        jina: boolean;
        depthVerif: boolean;
    },
    verifyResult: {
        verifyContent: string
        exaFinalResults: IClaim[];
        jinaFinalResults: IJinaClaim[];
    }
    content: string
};

export const userConfigAtom = atomWithStorage<UserConfigState>(
    "userConfig",
    {
        verifyParams: {
            exa: true,
            jina: true,
            depthVerif: false,
        },
        content: '',
        verifyResult: {
            verifyContent: '',
            exaFinalResults: [],
            jinaFinalResults: [],
        }
    },
    createJSONStorage(() =>
        typeof window !== "undefined"
            ? sessionStorage
            : {
                getItem: () => null,
                setItem: () => null,
                removeItem: () => null,
            }
    ),
    {
        getOnInit: true,
    }
);
