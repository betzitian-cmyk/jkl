/**
 * JSON utility functions for cleaning and parsing LLM outputs.
 * Robustly strips Markdown code blocks (e.g., ```json ... ```), prefixes, suffixes,
 * and conversational fluff before parsing.
 */

/**
 * Strips markdown code fences (```json, ```, etc.) from a string.
 */
export function stripMarkdownCodeBlocks(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/^```[a-zA-Z0-9_-]*\s*/gm, '') // opening fences like ```json, ```JSON, ```
    .replace(/```\s*$/gm, '')                // closing fences
    .replace(/```(?:json)?\n?/gi, '')        // inline occurrences
    .replace(/```\n?/g, '')
    .trim();
}

/**
 * Isolates the outermost JSON object `{...}` or JSON array `[...]` substring.
 * Removes any leading conversational text (e.g., "Here is the extracted invoice:")
 * and any trailing explanations.
 */
export function extractJsonSubstring(raw: string): string {
  if (!raw || typeof raw !== 'string') return '{}';

  const firstBrace = raw.indexOf('{');
  const firstBracket = raw.indexOf('[');

  // Determine whether the JSON structure starts with an object '{' or an array '['
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx === -1) {
    return raw.trim() || '{}';
  }

  const isArray = raw[startIdx] === '[';
  const lastTarget = isArray ? raw.lastIndexOf(']') : raw.lastIndexOf('}');
  
  if (lastTarget !== -1 && lastTarget > startIdx) {
    return raw.substring(startIdx, lastTarget + 1).trim();
  }

  return raw.substring(startIdx).trim();
}

/**
 * Cleans raw AI response text by:
 * 1. Stripping Markdown code block tags (` ```json `, ` ``` `, etc.)
 * 2. Isolating the outermost JSON object or array
 * 3. Cleaning invalid control characters
 *
 * @param rawResponse The raw string response from an LLM
 * @returns Cleaned string guaranteed to be isolated for JSON parsing
 */
export function cleanJsonResponse(rawResponse: string): string {
  if (!rawResponse || typeof rawResponse !== 'string') {
    return '{}';
  }

  // 1. Strip Markdown wrappers
  let cleaned = stripMarkdownCodeBlocks(rawResponse);

  // 2. Isolate outermost JSON object/array
  cleaned = extractJsonSubstring(cleaned);

  // 3. Fallback check if wrapped again
  if (cleaned.startsWith('```')) {
    cleaned = stripMarkdownCodeBlocks(cleaned);
  }

  return cleaned || '{}';
}

/**
 * Safely parses a potentially dirty JSON string returned by an LLM.
 * Automatically cleans markdown and conversational text, and handles double-stringification.
 *
 * @param rawResponse The raw string response from the AI model
 * @param fallback Optional fallback value if parsing completely fails
 * @returns Parsed JSON object or fallback
 */
export function parseCleanJson<T = any>(rawResponse: string, fallback?: T): T {
  if (!rawResponse) return (fallback ?? {}) as T;

  const clean = cleanJsonResponse(rawResponse);

  try {
    const parsed = JSON.parse(clean);
    // If the LLM returned a JSON string of a JSON object (double stringified), parse once more
    if (typeof parsed === 'string') {
      try {
        const unnested = JSON.parse(cleanJsonResponse(parsed));
        return unnested as T;
      } catch {
        return parsed as unknown as T;
      }
    }
    return parsed as T;
  } catch (err) {
    // Attempt aggressive sanitization: strip invalid ASCII control characters & trailing commas
    try {
      const aggressiveClean = clean
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
        .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
      return JSON.parse(aggressiveClean) as T;
    } catch (secondErr) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Failed to parse cleaned JSON response: ${(err as Error).message}`);
    }
  }
}

export const safeJsonParse = parseCleanJson;
export const safeParseJson = parseCleanJson;

export default {
  stripMarkdownCodeBlocks,
  extractJsonSubstring,
  cleanJsonResponse,
  parseCleanJson,
  safeJsonParse,
  safeParseJson,
};
