'use server';

/**
 * @fileOverview A personalized video recommendation AI agent.
 *
 * - generateVideoRecommendations - A function that generates personalized video recommendations.
 * - VideoRecommendationsInput - The input type for the generateVideoRecommendations function.
 * - VideoRecommendationsOutput - The return type for the generateVideoRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VideoRecommendationsInputSchema = z.object({
  userProfile: z.object({
    username: z.string().describe('The username of the current user.'),
    likedVideos: z.array(z.string()).describe('An array of video IDs that the user has liked.'),
    viewedVideos: z.array(z.string()).describe('An array of video IDs that the user has viewed.'),
    subscribedChannels: z.array(z.string()).describe('An array of channel usernames that the user is subscribed to.'),
  }).describe('The user profile information.'),
  allVideos: z.array(z.object({
    id: z.string().describe('The ID of the video.'),
    title: z.string().describe('The title of the video.'),
    description: z.string().describe('The description of the video.'),
    username: z.string().describe('The username of the channel that uploaded the video.'),
    views: z.number().describe('The number of views the video has.'),
    likes: z.number().describe('The number of likes the video has.'),
    commentCount: z.number().describe('The number of comments the video has.'),
  })).describe('An array of all available videos.'),
  boostByViews: z.number().describe('A multiplier to boost videos with high view count'),
  boostByLikes: z.number().describe('A multiplier to boost videos with high like count'),
});
export type VideoRecommendationsInput = z.infer<typeof VideoRecommendationsInputSchema>;

const VideoRecommendationsOutputSchema = z.array(z.object({
  id: z.string().describe('The ID of the recommended video.'),
  score: z.number().describe('The recommendation score for the video.'),
})).describe('An array of recommended video IDs with their recommendation scores.');
export type VideoRecommendationsOutput = z.infer<typeof VideoRecommendationsOutputSchema>;

export async function generateVideoRecommendations(input: VideoRecommendationsInput): Promise<VideoRecommendationsOutput> {
  return videoRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'videoRecommendationsPrompt',
  input: {schema: VideoRecommendationsInputSchema},
  output: {schema: VideoRecommendationsOutputSchema},
  prompt: `You are a video recommendation expert.

  Given the following user profile and a list of all available videos, you will generate a list of recommended video IDs with their recommendation scores.

  User Profile:
  {{json userProfile}}

  All Videos:
  {{json allVideos}}

  Instructions:
  1. Calculate a recommendation score for each video based on the user's profile and the video's attributes.
  2. Videos that the user has liked should have a higher score.
  3. Videos from channels that the user is subscribed to should have a higher score.
  4. Videos with high view counts should have a higher score, multiplied by {{boostByViews}}.
  5. Videos with high like counts should have a higher score, multiplied by {{boostByLikes}}.
  6. Videos with high comment counts should have a higher score.
  7. Return a JSON array of recommended video IDs with their recommendation scores, sorted by score in descending order.
  8. Only return videos that the user has not already liked or viewed.
  `,
});

const videoRecommendationsFlow = ai.defineFlow(
  {
    name: 'videoRecommendationsFlow',
    inputSchema: VideoRecommendationsInputSchema,
    outputSchema: VideoRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
