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

export const profile: Profile = {
  name: "ふらる",
  aka: ["hurarunium", "ふらるにうむ"],
  tagline: "Geometric Never-Ending Creating",
  intro: "ゲームを作ったり、文章を書いたり、思いついたものを形にするのが好きです。",
};

export const links: Link[] = [
  { label: "X", url: "https://x.com/hurarunium_sabu" },
  { label: "GitHub", url: "https://github.com/huraru7" },
  { label: "Portfolio", url: "https://portfolio.huraru.com" },
  { label: "note", url: "https://note.com/huraru" },
];
