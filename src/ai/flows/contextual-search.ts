'use server';

/**
 * @fileOverview Implements contextual search for videos and channels using keywords.
 *
 * - searchContent - A function that searches for content based on a query.
 * - SearchContentInput - The input type for the searchContent function.
 * - SearchContentOutput - The return type for the searchContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchContentInputSchema = z.object({
  query: z.string().describe('The search query string.'),
  contentList: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      username: z.string(),
  })).describe('A list of content to search through.'),
});
export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;

const SearchContentOutputSchema = z.array(z.object({
    id: z.string().describe("The ID of the content item."),
    title: z.string().describe("The title of the content item."),
    description: z.string().describe("The description of the content item."),
    username: z.string().describe("The username of the author."),
}));
export type SearchContentOutput = z.infer<typeof SearchContentOutputSchema>;

export async function searchContent(input: SearchContentInput): Promise<SearchContentOutput> {
  return searchContentFlow(input);
}

const searchContentPrompt = ai.definePrompt({
  name: 'searchContentPrompt',
  input: {schema: SearchContentInputSchema},
  output: {schema: SearchContentOutputSchema},
  prompt: `You are a search assistant. Given a query and a list of content, you will return a list of content that matches the query, sorted by relevance.

Query: {{{query}}}
Content List: {{json contentList}}`,
});

const searchContentFlow = ai.defineFlow(
  {
    name: 'searchContentFlow',
    inputSchema: SearchContentInputSchema,
    outputSchema: SearchContentOutputSchema,
  },
  async input => {
    const {output} = await searchContentPrompt(input);
    return output!;
  }
);
