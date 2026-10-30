export type Language = "en" | "ta";
export function changeLanguage<T extends { language: Language }>(
  state: T,
  language: Language,
): T {
  return { ...state, language };
}
