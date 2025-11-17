import { fetchStoryblokStories } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";

export default async function ClimateContentPage() {
  // Fetch climate-related content from Storyblok
  const data = await fetchStoryblokStories({
    starts_with: 'climate/',
    per_page: 10,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Climate Content Hub
          </h1>
          <p className="text-lg text-gray-600">
            Dynamic climate content powered by Storyblok CMS and AI
          </p>
        </div>

        {data?.stories && data.stories.length > 0 ? (
          <div className="space-y-6">
            {data.stories.map((story: any) => (
              <StoryblokStory key={story.uuid} story={story} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🚀 Ready for Storyblok Content!
            </h2>
            <p className="text-gray-600 mb-6">
              Your Storyblok integration is set up. Follow the setup guide to add your API keys and create content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                <li>Create a Storyblok space at <a href="https://app.storyblok.com" className="underline" target="_blank" rel="noopener noreferrer">app.storyblok.com</a></li>
                <li>Get your Content API token from Settings → API-Keys</li>
                <li>Add the token to your .env.local file</li>
                <li>Create content types: climate_alert, drought_tips, crop_profile, etc.</li>
                <li>Start adding climate content!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
