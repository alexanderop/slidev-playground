import { z } from 'zod/mini'

export const SlideFrontmatterSchema = z.object({
  layout: z.optional(z.string()),
  transition: z.optional(z.string()),
  background: z.optional(z.string()),
  backgroundImage: z.optional(z.string()),
  image: z.optional(z.string()),
  class: z.optional(z.union([z.string(), z.array(z.string())])),
  lineNumbers: z.optional(z.boolean()),
  clicks: z.optional(z.number()),
  disabled: z.optional(z.boolean()),
  hide: z.optional(z.boolean()),
  url: z.optional(z.string()),
})
