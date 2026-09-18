/**
 * Text Similarity Utilities
 * - TF-IDF keyword fingerprinting for fast article deduplication
 * - Cosine similarity over sparse TF-IDF vectors
 * - Jaccard title similarity for fast first-pass filtering
 */

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","is","was","are","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall",
  "this","that","these","those","it","its","as","if","then","than","so",
  "he","she","they","we","you","i","me","him","her","us","them","my","our",
  "your","his","their","its","what","which","who","how","when","where","why",
  "not","no","nor","yet","both","either","neither","each","all","any","more",
  "most","such","just","now","new","one","two","three","also","about","over",
  "after","before","between","into","through","during","including","against",
  "said","says","report","reports","according","per","amid",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function computeTf(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const tok of tokens) {
    freq.set(tok, (freq.get(tok) ?? 0) + 1);
  }
  const total = tokens.length || 1;
  const tf = new Map<string, number>();
  for (const [tok, count] of freq) {
    tf.set(tok, count / total);
  }
  return tf;
}

export function extractKeywordFingerprint(title: string, summary: string): Map<string, number> {
  const titleTokens = tokenize(title);
  const summaryTokens = tokenize(summary);
  // Title tokens weighted 3x, summary tokens 1x
  const combined = [
    ...titleTokens, ...titleTokens, ...titleTokens,
    ...summaryTokens,
  ];
  return computeTf(combined);
}

export function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, valA] of vecA) {
    const valB = vecB.get(term) ?? 0;
    dot += valA * valB;
    magA += valA * valA;
  }
  for (const [, valB] of vecB) {
    magB += valB * valB;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

export function jaccardTitleSimilarity(titleA: string, titleB: string): number {
  const setA = new Set(tokenize(titleA));
  const setB = new Set(tokenize(titleB));
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return intersection / union;
}

export function articleSimilarity(
  titleA: string,
  summaryA: string,
  titleB: string,
  summaryB: string
): number {
  const jaccard = jaccardTitleSimilarity(titleA, titleB);
  const fpA = extractKeywordFingerprint(titleA, summaryA);
  const fpB = extractKeywordFingerprint(titleB, summaryB);
  const cosine = cosineSimilarity(fpA, fpB);
  // Weighted: 40% Jaccard title + 60% cosine TF-IDF
  return 0.4 * jaccard + 0.6 * cosine;
}

export function generateClusterKey(title: string): string {
  const tokens = tokenize(title)
    .filter((t) => t.length > 3)
    .slice(0, 6)
    .sort()
    .join("-");
  return tokens || title.toLowerCase().slice(0, 40).replace(/\s+/g, "-");
}
