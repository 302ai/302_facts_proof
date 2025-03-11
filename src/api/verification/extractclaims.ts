'use server'

import { IParams } from ".";
import { generateText } from 'ai';
import { baseURL } from '../type';
import { createAI302 } from '@302ai/ai-sdk';

export async function onExtractclaims(params: IParams) {
  const { content, apiKey, modelId } = params;

  try {
    const model = createAI302({ apiKey, baseURL })
    const { text } = await generateText({
      model: model.chatModel(modelId),
      prompt:
        `You are an expert at extracting claims from text.
        Your task is to identify and list all claims present, true or false, in the given text. Each claim should be a verifiable statement.
        
        If the input content is very lengthy, then pick the major claims.
  
        Don't repeat the same claim.
  
        For each claim, also provide the original part of the sentence from which the claim is derived.
  
        Keep the language the same as original text.
  
        Present the claims as a JSON array of objects. Each object should have two keys:
        - "claim": the extracted claim in a single verifiable statement.
        - "original_text": the portion of the original text that supports or contains the claim.
        
        Do not include any additional text or commentary.
  
        Here is the content: ${content}
  
        Return the output strictly as a JSON array of objects following this schema:
        [
          {
            "claim": "extracted claim here",
            "original_text": "original text portion here"
          },
          ...
        ]
  
          Output the result as valid JSON, strictly adhering to the defined schema. Ensure there are no markdown codes or additional elements included in the output. Do not add anything else. Return only JSON.
        `,
    });

    const jsonString = text.replace(/```json|```/g, '').trim();
    const obj = JSON.parse(jsonString);
    return { claims: obj };
  } catch (error: any) {
    if (error.responseBody) {
      const errorData = JSON.parse(error.responseBody);
      return { ...errorData }
    }
    return error;
  }
}

