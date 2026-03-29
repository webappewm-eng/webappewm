import { notFound } from "next/navigation";
import { PostPageClient } from "@/components/post/PostPageClient";
import { getPostBySlug, getPosts } from "@/lib/firebase/data";
import { Post } from "@/lib/types";

export const revalidate = 60;

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

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadPostData(slug);

  if (!data.post) {
    notFound();
  }

  return <PostPageClient initialPost={data.post} initialRelated={data.related} />;
}
