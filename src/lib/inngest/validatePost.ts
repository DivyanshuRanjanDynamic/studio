export type IncomingPost = Record<string, any>;

export function validatePost(input: IncomingPost) {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    errors.push('post must be an object');
    return { valid: false, errors };
  }

  const id = input.id;
  const title = input.title;
  const summary =
    input.summary || input.content || input.body || input.html || "";

  if (!id || typeof id !== 'string')
    errors.push('id is required and must be a string');

  if (!title || typeof title !== 'string')
    errors.push('title is required and must be a string');

  if (!summary || typeof summary !== 'string')
    errors.push('summary/content is required and must be a string');

  // Optional validations
  if (typeof title === 'string' && title.length > 250)
    errors.push('title too long');

  if (typeof summary === 'string' && summary.length > 200000)
    errors.push('content too long');

  // ✅ SANITIZED OBJECT (FULL SHAPE)
  const sanitized = {
    id,
    title,
    summary,

    image: typeof input.image === 'string' ? input.image : "",

    slug: typeof input.slug === 'string' ? input.slug : "",
    url: typeof input.url === 'string' ? input.url : "",

    tags: Array.isArray(input.tags) ? input.tags : [],

    author: typeof input.author === 'string' ? input.author : "Unknown",

    // 🔥 CRITICAL FIXES
    date:
      typeof input.date === 'string'
        ? input.date
        : new Date().toISOString(),

    readingTime: {
      text:
        typeof input.readingTime?.text === 'string'
          ? input.readingTime.text
          : "5 min read",
    },
  };

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}