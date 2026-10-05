export interface Profile {
  name: string;
  aka: string[];
  tagline: string;
  intro: string;
}

export interface Link {
  label: string;
  url: string;
}

// サイト名(title・検索結果・ヘッダーのロゴで共通に使う)
export const siteName = "huraru(home)";

export const profile: Profile = {
  name: "ふらる",
  aka: ["hurarunium", "ふらるにうむ"],
  tagline: "Geometric Never-Ending Creating",
  intro: "ゲームを作ったり。ツールを作ったり。 思ったものを作ることが好きです。",
};

export const links: Link[] = [
  { label: "X", url: "https://x.com/hurarunium_sabu" },
  { label: "GitHub", url: "https://github.com/huraru7" },
  { label: "Portfolio", url: "https://portfolio.huraru.com" },
  { label: "note", url: "https://note.com/huraru" },
];
