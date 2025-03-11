import { authKy } from "@/api/auth";

interface ConfigResponse {
  code: number;
  msg: string;
  data: {
    config: {
      [key: string]: any;
    };
    version: string;
  };
}

interface UpdateConfigRequest {
  values: {
    [key: string]: any;
  };
  current_version: string;
}

export const getConfig = async (hostname: string, apiKey: string) => {
  const toolId = hostname.split("-")[0];

  const res = await authKy
    .get(`gpt/api/v1/tool/config/${toolId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    .json<ConfigResponse>();

  return res.data;
};

export const updateConfig = async (
  hostname: string,
  apiKey: string,
  values: Record<string, any>,
  currentVersion: string
) => {
  const toolId = hostname.split("-")[0];

  return authKy.put(`gpt/api/v1/tool/config/${toolId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    json: {
      values,
      current_version: currentVersion,
    } as UpdateConfigRequest,
  });
};
