"use client";

import { getStoryblokApi } from "@/lib/storyblok";
import { storyblokComponents } from "@/components/storyblok";
import { storyblokInit } from "@storyblok/react/rsc";

// Initialize Storyblok with components
storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN!,
  components: storyblokComponents,
});

export default function StoryblokProvider({ children }: { children: React.ReactNode }) {
  getStoryblokApi();
  return children;
}
