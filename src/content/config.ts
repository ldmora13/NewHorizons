import { defineCollection, z } from "astro:content";

// Pages
const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    updated: z.string().optional(),
  }),
});

// Blogs
const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    cover: z.string(),
    date: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    readTime: z.number(),
    description: z.string(),

    // Author object
    author: z.object({
      name: z.string(),
      job: z.string(),
      avatar: z.string(),
    }),
  }),
});

const countries = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.string(),
    description: z.string(),
    cover: z.string(),
    gallery: z.array(z.string()).optional(),
    duration: z.string(),
    location: z.string(),
    investment: z.number().optional(),
    pricing: z.array(
      z.object({
        label: z.string(),
        price: z.number(),
        multiplier: z.number().optional(), // optional (for booking logic)
      })
    ),

    rating: z.number().optional(),
    reviews: z.number().optional(),
    facilities: z.array(z.string()).optional(),
    i18nKey: z.string().optional(),
  }),
});

export const collections = {
  pages,
  countries,
};