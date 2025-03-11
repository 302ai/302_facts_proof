export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI 事实求证",
      description: "使用Jina和Exa搜索相关概念证实内容表达是否成立",
      image: "/images/global/verify_cn_tool_logo.png",
    },
    en: {
      title: "AI facts proof",
      description: "Use Jina and Exa to search for relevant concepts and verify whether the content expression is valid",
      image: "/images/global/verify_en_tool_logo.png",
    },
    ja: {
      title: "AI 事実証拠",
      description: "JinaとExa検索に関する概念を用いてコンテンツ表現が成立するかどうかを確認する",
      image: "/images/global/verify_jp_tool_logo.png",
    },
  },
};
