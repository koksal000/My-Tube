# **App Name**: My-Tube Reborn

## Core Features:

- User Authentication: User registration/login with username, password, and profile picture. This is handled with storing information in indexeddb and not transferring it out.
- Channel and Content Management: Personalized channel creation and management for uploading and sharing videos and posts with followers. All data, including videos and images, are compressed for offline use in user's indexedDB.
- Direct Messaging: Direct Messaging for users can privately communicate and share content. Using a custom hashing method, usernames, which are used in direct messages are sorted into an array which serves as the 'conversation ID'.
- Intuitive Navigation: Intuitive UI for users can smoothly navigate through home, explore, and subscription feeds with simple scrolling and search functions.
- Offline Introductory Video: Offline access with storing an introductory video in indexedDB to ensure accessibility even without an active internet connection. Background blurring behind a video element of a set shape with set dimentions on larger display is possible due to this video. User thumbnails also stay persistent.
- Intelligent Video Recommendations: The LLM uses the tool `generate_recommendations` to decide which videos and channels to recommend to a given user. Video recommendations in the explore feed are boosted based on engagement score calculations, which weigh views, likes, dislikes and comments.
- Contextual Search: The LLM uses the tool `search_content` to retrieve all videos and channels in a user requested search and return them. Robust video/user search, filtering results by relevance using scored keyword matching and sorting by date.

## Style Guidelines:

- Primary color: Deep scarlet (#C70039) for an engaging and bold feel.
- Background color: Dark grey (#212529) to provide a sophisticated and distraction-free backdrop.
- Accent color: Soft orange (#FFC300) to highlight key interactive elements and CTAs.
- Font: 'Inter', a sans-serif font, for a clean, modern, and highly readable UI, for both headers and body.
- Lucide icons provide a consistent and minimalist style, with intuitive glyphs to aid in user navigation.
- Grid-based layout creates a structured and responsive design, adapting smoothly across various devices for a consistent viewing experience.
- Subtle, elegant transitions enhance user experience and visual appeal.