export interface BlogPost {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  image?: string;
  tags?: string[];
  draft?: boolean;
}

declare global {
  interface Window {
    blogPosts: BlogPost[];
  }
}
