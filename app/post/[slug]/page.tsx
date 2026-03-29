import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostPageClient } from "@/components/post/PostPageClient";
import { getPostBySlug, getPosts, getSiteSettings } from "@/lib/firebase/data";
import { Post } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = true;

async function loadPostData(slug: string): Promise<{ post: Post | null; related: Post[] }> {
  try {
    const post = await getPostBySlug(slug);
    if (!post) {
      return { post: null, related: [] };
    }

    const list = await getPosts({ categoryId: post.categoryId });
    const related = list.filter((item) => item.id !== post.id).slice(0, 3);
    return { post, related };
  } catch {
    return { post: null, related: [] };
  }
}

export async function generateStaticParams() {
  try {
    const posts = await getPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found"
    };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined
    }
  };
}

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([loadPostData(slug), getSiteSettings()]);

  if (!data.post) {
    notFound();
  }

  return (
    <PostPageClient
      initialPost={data.post}
      initialRelated={data.related}
      initialPreviewEnabled={settings.contentPreviewEnabled}
      initialPreviewPercent={settings.contentPreviewPercent}
    />
  );
}
