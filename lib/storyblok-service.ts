import { getStoryblokApi } from "./storyblok";

export interface ResourceItem {
  item_name: string;
  description: string;
  website_url: string;
  contact_info: string;
}

export interface ResourceCategory {
  category_title: string;
  resource_items: ResourceItem[];
}

export interface ResourceSection {
  feature_name: string;
  country: string;
  section_1: ResourceCategory[];
  section_2: ResourceCategory[];
}

export interface CountryTheme {
  country_code: string;
  country_name: string;
  hero_title: string;
  hero_subtitle: string;
  welcome_message: string;
  background_image_url: string;
  primary_cta_text: string;
  primary_cta_url: string;
  secondary_cta_text: string;
  secondary_cta_url: string;
}

export interface CommunityUpdate {
  country: string;
  update_title: string;
  update_content: string;
  expert_name: string;
  expert_title: string;
  update_date: string;
  related_feature?: string;
}

export interface EventItem {
  country: string;
  event_title: string;
  event_description: string;
  event_date: string;
  event_location: string;
  registration_url?: string;
  event_image?: string;
  event_category: string;
}

export interface NewsItem {
  country: string;
  news_title: string;
  news_summary: string;
  publication_date: string;
  source_url: string;
  news_category: string;
}

const FEATURE_MAPPING = {
  "drought-crops": "Drought Crops",
  "water-conservation": "Water Conservation",
  "solar-optimizer": "Solar Optimizer",
  "habitat-protection": "Habitat Protection",
  "farm-equipment": "Farm Equipment",
};

class StoryblokService {
  private getApi() {
    return getStoryblokApi();
  }

  async getResourceSection(
    country: string,
    feature: string,
    language: string = "en"
  ): Promise<ResourceSection | null> {
    try {
      const countryCode = country.toLowerCase();
      const featureSlug = feature.toLowerCase().replace(/[-_]/g, "-");

      console.log(
        `Fetching resource: resources/${countryCode}/${featureSlug} in language: ${language}`
      );

      const api = this.getApi();

      const params: any = {
        version: "published",
      };

      // Only add language params if not English (Storyblok default)
      if (language !== "en") {
        params.language = language;
        params.fallback_lang = "en";
        console.log("Adding language parameters:", params);
      }

      const { data } = await api.get(
        `cdn/stories/resources/${countryCode}/${featureSlug}`,
        params
      );

      if (data && data.story && data.story.content) {
        const transformed = this.transformResourceSection(data.story.content);
        console.log(
          `Resource loaded in ${language}:`,
          transformed.feature_name
        );
        return transformed;
      }

      return null;
    } catch (error) {
      console.error(
        `Failed to fetch resource section for ${country}/${feature} in ${language}:`,
        error
      );
      return null;
    }
  }

  async getCountryTheme(
    country: string,
    language: string = "en"
  ): Promise<CountryTheme | null> {
    try {
      const countryCode = country.toLowerCase();

      console.log(
        `Fetching theme: themes/${countryCode} in language: ${language}`
      );

      const params: any = {
        version: "published",
        starts_with: "themes/",
      };

      if (language !== "en") {
        params.language = language;
        params.fallback_lang = "en";
      }

      const { data: allStories } = await this.getApi().get(
        "cdn/stories",
        params
      );

      console.log(
        "Available theme stories:",
        allStories.stories.map((s: any) => s.full_slug)
      );

      const { data } = await this.getApi().get(
        `cdn/stories/themes/${countryCode}`,
        {
          version: "published",
        }
      );

      console.log(
        `Raw theme response for ${countryCode}:`,
        JSON.stringify(data, null, 2)
      );

      if (data && data.story && data.story.content) {
        const transformed = this.transformCountryTheme(data.story.content);
        console.log(
          "Transformed theme data:",
          JSON.stringify(transformed, null, 2)
        );
        return transformed;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch theme for ${country}:`, error);
      if (error instanceof Error) {
        console.error("Theme error details:", error.message);
      }
      return null;
    }
  }

  async getCommunityUpdates(
    country: string,
    language: string = "en"
  ): Promise<CommunityUpdate[]> {
    try {
      const countryCode = country.toLowerCase();

      console.log(`Fetching community updates for: ${countryCode}`);

      const { data } = await this.getApi().get(
        `cdn/stories/community-hub/${countryCode}/resource-updates`,
        {
          version: "published",
          language: language,
          fallback_lang: "en",
        }
      );

      if (data && data.story && data.story.content) {
        return this.transformCommunityUpdates(data.story.content);
      }

      return [];
    } catch (error) {
      console.error(`Failed to fetch community updates for ${country}:`, error);
      return [];
    }
  }

  async getEnvironmentalEvents(
    country: string,
    language: string = "en"
  ): Promise<EventItem[]> {
    try {
      const countryCode = country.toLowerCase();

      console.log(`Fetching environmental events for: ${countryCode}`);

      const { data } = await this.getApi().get(`cdn/stories`, {
        version: "published",
        starts_with: `events-news/${countryCode}/environmental-events/`,
        per_page: 100,
        language: language,
        fallback_lang: "en",
      });

      if (data && data.stories && Array.isArray(data.stories)) {
        const events: EventItem[] = [];

        data.stories.forEach((story: any) => {
          if (story.content && story.content.component === "event_item") {
            events.push({
              country: story.content.country || countryCode.toUpperCase(),
              event_title: story.content.event_title,
              event_description: story.content.event_description,
              event_date: story.content.event_date,
              event_location: story.content.event_location,
              event_category: story.content.event_category,
              registration_url: story.content.registration_url,
              event_image: story.content.event_image?.filename,
            });
          }
        });

        return events;
      }

      return [];
    } catch (error) {
      console.error(
        `Failed to fetch environmental events for ${country}:`,
        error
      );
      return [];
    }
  }

  async getLatestNews(
    country: string,
    language: string = "en"
  ): Promise<NewsItem[]> {
    try {
      const countryCode = country.toLowerCase();

      console.log(`Fetching latest news for: ${countryCode}`);

      const { data } = await this.getApi().get(`cdn/stories`, {
        version: "published",
        starts_with: `events-news/${countryCode}/latest-news/`,
        per_page: 100,
        language: language,
        fallback_lang: "en",
      });

      if (data && data.stories && Array.isArray(data.stories)) {
        const news: NewsItem[] = [];

        data.stories.forEach((story: any) => {
          if (story.content && story.content.component === "news_item") {
            news.push({
              country: story.content.country || countryCode.toUpperCase(),
              news_title: story.content.news_title,
              news_summary: story.content.news_summary,
              publication_date: story.content.publication_date,
              news_category: story.content.news_category,
              source_url: story.content.source_url,
            });
          }
        });

        return news;
      }

      return [];
    } catch (error) {
      console.error(`Failed to fetch latest news for ${country}:`, error);
      return [];
    }
  }

  private transformResourceSection(content: any): ResourceSection {
    return {
      feature_name: content.feature_name,
      country: content.country,
      section_1: this.transformResourceCategories(content.section_1),
      section_2: this.transformResourceCategories(content.section_2),
    };
  }

  private transformResourceCategories(sections: any[]): ResourceCategory[] {
    if (!Array.isArray(sections)) return [];

    return sections.map((section) => ({
      category_title: section.category_title,
      resource_items: this.transformResourceItems(section.resource_items),
    }));
  }

  private transformResourceItems(items: any[]): ResourceItem[] {
    if (!Array.isArray(items)) return [];

    return items.map((item) => ({
      item_name: item.item_name,
      description: item.description,
      website_url: item.website_url,
      contact_info: item.contact_info,
    }));
  }

  private transformCountryTheme(content: any): CountryTheme {
    return {
      country_code: content.country || content.country_code,
      country_name: content.country_name,
      hero_title: content.hero_title,
      hero_subtitle: content.hero_subtitle,
      welcome_message: content.welcome_message,
      background_image_url:
        content.hero_image?.filename || content.background_image_url,
      primary_cta_text: content.primary_cta_text,
      primary_cta_url: content.primary_cta_url,
      secondary_cta_text: content.secondary_cta_text,
      secondary_cta_url: content.secondary_cta_url,
    };
  }

  private transformCommunityUpdates(content: any): CommunityUpdate[] {
    // Handle single community update object from Storyblok
    if (content.Country || content.country) {
      return [
        {
          country: content.Country || content.country,
          update_title: content.update_title,
          update_content: content.update_content,
          expert_name: content.expert_name,
          expert_title: content.expert_title,
          update_date: content.update_date,
          related_feature: content.related_feature,
        },
      ];
    }

    // Handle array of updates (if multiple updates in one story)
    if (content.updates && Array.isArray(content.updates)) {
      return content.updates.map((update: any) => ({
        country: update.Country || update.country,
        update_title: update.update_title,
        update_content: update.update_content,
        expert_name: update.expert_name,
        expert_title: update.expert_title,
        update_date: update.update_date,
        related_feature: update.related_feature,
      }));
    }

    return [];
  }

  private transformEventItems(content: any): EventItem[] {
    if (!content.events || !Array.isArray(content.events)) return [];

    return content.events.map((event: any) => ({
      country: event.country,
      event_title: event.event_title,
      event_description: event.event_description,
      event_date: event.event_date,
      event_location: event.event_location,
      registration_url: event.registration_url,
      event_image: event.event_image?.filename,
      event_category: event.event_category,
    }));
  }

  private transformNewsItems(content: any): NewsItem[] {
    if (!content.news || !Array.isArray(content.news)) return [];

    return content.news.map((news: any) => ({
      country: news.country,
      news_title: news.news_title,
      news_summary: news.news_summary,
      publication_date: news.publication_date,
      source_url: news.source_url,
      news_category: news.news_category,
    }));
  }

  getFallbackResourceSection(
    country: string,
    feature: string
  ): ResourceSection {
    return {
      feature_name: feature,
      country: country,
      section_1: [
        {
          category_title: "Resources",
          resource_items: [
            {
              item_name: "Local Resources",
              description: `Find ${feature.toLowerCase()} resources in your area`,
              website_url: "#",
              contact_info: "Contact your local extension office",
            },
          ],
        },
      ],
      section_2: [
        {
          category_title: "Support",
          resource_items: [
            {
              item_name: "Technical Support",
              description: "Get technical assistance and guidance",
              website_url: "#",
              contact_info: "Local technical support",
            },
          ],
        },
      ],
    };
  }

  getFallbackCountryTheme(country: string): CountryTheme {
    const themes: Record<string, CountryTheme> = {
      usa: {
        country_code: "usa",
        country_name: "United States",
        hero_title: "Protecting America's Environment with AI",
        hero_subtitle:
          "Advanced climate solutions for sustainable agriculture and conservation across the United States",
        welcome_message:
          "Welcome to ClimateIQ AI - your partner in building a sustainable future for American agriculture and environmental conservation.",
        background_image_url: "/images/american-landscape.jpg",
        primary_cta_text: "Explore US Climate Solutions",
        primary_cta_url: "/features",
        secondary_cta_text: "View Conservation Programs",
        secondary_cta_url: "/resources",
      },
      india: {
        country_code: "india",
        country_name: "India",
        hero_title: "भारत के लिए AI-संचालित पर्यावरण समाधान",
        hero_subtitle:
          "Sustainable farming and climate resilience solutions tailored for Indian agriculture and environmental challenges",
        welcome_message:
          "नमस्ते! ClimateIQ AI के साथ भारतीय कृषि और पर्यावरण संरक्षण के लिए उन्नत समाधान खोजें।",
        background_image_url: "/images/indian-agricultural-landscape.jpg",
        primary_cta_text: "भारतीय समाधान देखें",
        primary_cta_url: "/features",
        secondary_cta_text: "सरकारी योजनाएं",
        secondary_cta_url: "/resources",
      },
      global: {
        country_code: "global",
        country_name: "Global",
        hero_title: "AI-Powered Environmental Solutions",
        hero_subtitle:
          "Sustainable climate solutions for agriculture and conservation worldwide",
        welcome_message:
          "Welcome to ClimateIQ AI - your partner in building a sustainable future for global agriculture and environmental conservation.",
        background_image_url: "",
        primary_cta_text: "Explore Climate Solutions",
        primary_cta_url: "/features",
        secondary_cta_text: "Learn More",
        secondary_cta_url: "/about",
      },
    };

    return themes[country] || themes["global"];
  }

  getFallbackCommunityUpdates(country: string): CommunityUpdate[] {
    return [
      {
        country: country,
        update_title: "Community Resources Available",
        update_content:
          "Connect with local experts and extension services for the latest agricultural and environmental guidance.",
        expert_name: "Local Extension Office",
        expert_title: "Agricultural Specialist",
        update_date: new Date().toISOString(),
        related_feature: undefined,
      },
    ];
  }

  getFallbackEvents(country: string): EventItem[] {
    return [
      {
        country: country,
        event_title: "Local Environmental Workshop",
        event_description:
          "Join community workshops focused on sustainable agriculture and environmental conservation practices.",
        event_date: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        event_location: "Community Center",
        registration_url: "#",
        event_category: "Workshop",
      },
    ];
  }

  getFallbackNews(country: string): NewsItem[] {
    return [
      {
        country: country,
        news_title: "Environmental Conservation Updates",
        news_summary:
          "Stay informed about the latest environmental policies and conservation initiatives in your region.",
        publication_date: new Date().toISOString(),
        source_url: "#",
        news_category: "Policy Update",
      },
    ];
  }
}

export const storyblokService = new StoryblokService();
