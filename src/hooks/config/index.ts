import { useCallback } from "react";
import { getConfig, updateConfig } from "@/services/config";
import { useHostname } from "@/hooks/global/use-hostname";
import { env } from "@/env";
import { appConfigAtom } from "@/stores";
import { useAtom } from "jotai";

export const useConfig = () => {
  const [{ apiKey = '' }] = useAtom(appConfigAtom);
  const dynamicHostname = useHostname();
  const hostname = env.NEXT_PUBLIC_DEV_HOST_NAME || dynamicHostname;

  const fetchConfig = useCallback(async () => {
    if (!hostname || !apiKey) {
      throw new Error("Missing required parameters: hostname or apiKey");
    }

    return getConfig(hostname, apiKey);
  }, [hostname, apiKey]);

  const updateConfigValues = useCallback(
    async (values: Record<string, any>, currentVersion: string) => {
      if (!hostname || !apiKey) {
        throw new Error("Missing required parameters: hostname or apiKey");
      }

      return updateConfig(hostname, apiKey, values, currentVersion);
    },
    [hostname, apiKey]
  );

  return {
    fetchConfig,
    updateConfigValues,
    isReady: Boolean(hostname && apiKey),
  };
};
