export type CitationStyle = "APA7" | "MLA9" | "Harvard" | "IEEE";

export function generateCitation(
  topicOrTitle: string,
  style: CitationStyle = "APA7",
  author: string = "AlphaAsk Academic AI Engine",
  year: number = new Date().getFullYear()
): string {
  const cleanTitle = topicOrTitle.replace(/^📄\s*\[Attached:[^\]]+\]\s*/i, "").trim() || "Academic Subject Explanation";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  switch (style) {
    case "APA7":
      return `${author}. (${year}). ${cleanTitle} [AI academic assistance explanation]. AlphaAsk Academic System. Retrieved ${dateStr}, from https://alphaask.edu`;
    case "MLA9":
      return `"${cleanTitle}." ${author}, AlphaAsk Academic Support System, ${year}, https://alphaask.edu. Accessed ${dateStr}.`;
    case "Harvard":
      return `${author}, ${year}. ${cleanTitle}, AlphaAsk Academic Support Platform. Available at: <https://alphaask.edu> [Accessed ${dateStr}].`;
    case "IEEE":
      return `[1] ${author}, "${cleanTitle}," AlphaAsk Academic Platform, ${year}. [Online]. Available: https://alphaask.edu. [Accessed: ${dateStr}].`;
    default:
      return `${author} (${year}). ${cleanTitle}. AlphaAsk.`;
  }
}
