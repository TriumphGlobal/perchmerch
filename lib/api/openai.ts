import { env } from "@/env.mjs";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface GenerateTextOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Generate text using OpenAI's GPT model
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
    });

    return {
      text: response.choices[0]?.message?.content || "",
      success: true,
    };
  } catch (error) {
    console.error("Error generating text with OpenAI:", error);
    return {
      text: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate a product description based on product details
 */
export async function generateProductDescription(
  productName: string,
  productType: string,
  targetAudience: string,
  keyFeatures: string[]
) {
  const featuresText = keyFeatures.map(f => `- ${f}`).join("\n");
  
  const prompt = `
    Create a compelling product description for an e-commerce store.
    
    Product Name: ${productName}
    Product Type: ${productType}
    Target Audience: ${targetAudience}
    Key Features:
    ${featuresText}
    
    The description should be engaging, highlight the benefits, and be around 100-150 words.
  `;
  
  return generateText(prompt, { temperature: 0.8 });
}

/**
 * Generate product tags based on product details
 */
export async function generateProductTags(
  productName: string,
  productType: string,
  description: string
) {
  const prompt = `
    Generate 5-8 relevant tags for the following product:
    
    Product Name: ${productName}
    Product Type: ${productType}
    Description: ${description}
    
    Return only the tags as a comma-separated list, with no additional text.
  `;
  
  const { text, success } = await generateText(prompt, { temperature: 0.5 });
  
  if (success) {
    // Clean up the response to get just the tags
    return text
      .replace(/^tags:|\btags\b:?/i, "")
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
  
  return [];
} 