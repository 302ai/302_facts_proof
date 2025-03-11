'use server'

import { z } from 'zod';
import { IParams } from '.';
import { baseURL } from '../type';
import { generateObject } from 'ai';
import { createAI302 } from '@302ai/ai-sdk';

function getStringSizeInKB(str: string) {
  // 计算字符串的字节大小
  const byteSize = Buffer.from(str).length;
  // 转换为 KB
  const kbSize = byteSize / 1024;
  return kbSize < 50;
}

export async function onVerifyclaims(params: IParams & { claim: string, original_text: string, sources: any[] }) {

  const { claim, original_text, sources, apiKey, modelId } = params;

  if (!claim || !original_text || !sources) {
    return { error: 'Claim and sources are required' };
  }

  const factCheckSchema = z.object({
    claim: z.string(),
    assessment: z.enum(["True", "False", "Insufficient Information"]),
    summary: z.string(),
    fixed_original_text: z.string(),
    confidence_score: z.number().min(0).max(100)
  });

  try {
    const model = createAI302({ apiKey, baseURL })
    const { object } = await generateObject({
      model: model.chatModel(modelId),
      schema: factCheckSchema,
      output: 'object',
      experimental_repairText: (async (options) => await options.text.toString().replace(/```json|```/g, '').trim()),
      prompt: `You are an expert fact-checker. Given a claim and a set of sources, determine whether the claim is true or false based on the text from sources (or if there is insufficient information).

        For your analysis, consider all the sources collectively.

        Keep the language the same as original text.

        Here are the sources:
        ${sources.filter(f => getStringSizeInKB(f.text)).map((source: any, index: number) => `Source ${index + 1}:
        Text: ${source.text}
        URL: ${source.url}
        `).join('\n')}

        Here is the Original part of the text: ${original_text}

        Here is the claim: ${claim}

        Provide your answer as a JSON object with the following structure:

        claim: "...",
        assessment: "True" or "False" or "Insufficient Information",
        summary: "Why is this claim correct and if it isn't correct, then what's correct. In a single line.",
        fixed_original_text: "If the assessment is False then correct the original text (keeping everything as it is and just fix the fact in the part of the text)",
        confidence_score: a percentage number between 0 and 100 (100 means fully confident that the decision you have made is correct, 0 means you are completely unsure),

        `,
    });
    return { ...object };
  } catch (error: any) {
    if (error.responseBody) {
      const errorData = JSON.parse(error.responseBody);
      return { ...errorData }
    }
    return error;
  }
}