import { type PostsBySection, getBlogPosts } from '@/lib/blog';
import type { ReactNode } from 'react';

interface BlogLayoutProps {
  children: ReactNode;
}

const BlogLayout = async ({ children }: BlogLayoutProps) => {
  const postsBySection: PostsBySection = await getBlogPosts();

  return (
    <div className="">
      <main className="">{children}</main>
    </div>
  );
};

export default BlogLayout;
