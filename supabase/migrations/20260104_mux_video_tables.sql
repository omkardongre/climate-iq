-- =====================================================
-- Mux Video Integration Tables for ClimateIQ AI
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Climate Videos Table
-- Stores user-uploaded climate story videos
-- =====================================================
CREATE TABLE IF NOT EXISTS climate_videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User who uploaded the video
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Mux asset identifiers
    mux_asset_id TEXT NOT NULL,
    mux_upload_id TEXT,
    playback_id TEXT,
    
    -- Video metadata
    title TEXT NOT NULL,
    description TEXT,
    duration NUMERIC,
    aspect_ratio TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
    error_message TEXT,
    
    -- Geolocation for map pins
    latitude NUMERIC,
    longitude NUMERIC,
    location_name TEXT,
    
    -- Climate categorization
    climate_topic TEXT CHECK (climate_topic IN ('agriculture', 'urban', 'education', 'weather', 'wildlife', 'other')),
    tags TEXT[],
    
    -- Engagement metrics (updated via webhooks or scheduled jobs)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_climate_videos_user_id ON climate_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_climate_videos_status ON climate_videos(status);
CREATE INDEX IF NOT EXISTS idx_climate_videos_playback_id ON climate_videos(playback_id);
CREATE INDEX IF NOT EXISTS idx_climate_videos_location ON climate_videos(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_climate_videos_climate_topic ON climate_videos(climate_topic);
CREATE INDEX IF NOT EXISTS idx_climate_videos_created_at ON climate_videos(created_at DESC);

-- =====================================================
-- Live Streams Table
-- Stores farmer broadcast live streams
-- =====================================================
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User who created the stream
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Mux stream identifiers
    mux_stream_id TEXT NOT NULL,
    stream_key TEXT NOT NULL,
    playback_id TEXT,
    
    -- Stream metadata
    title TEXT NOT NULL,
    description TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'disabled')),
    
    -- Recording link (VOD after stream ends)
    recording_asset_id TEXT,
    
    -- Geolocation for map pins
    latitude NUMERIC,
    longitude NUMERIC,
    location_name TEXT,
    
    -- Categorization
    stream_type TEXT CHECK (stream_type IN ('harvest', 'weather', 'expert_advice', 'community', 'other')),
    
    -- Timing
    scheduled_start TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Engagement
    peak_viewers INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for live streams
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_mux_stream_id ON live_streams(mux_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_location ON live_streams(latitude, longitude);

-- =====================================================
-- Climate Reports Table
-- Stores AI-generated climate report videos
-- =====================================================
CREATE TABLE IF NOT EXISTS climate_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User who generated the report
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Mux asset identifiers
    mux_asset_id TEXT,
    playback_id TEXT,
    
    -- Report metadata
    report_type TEXT CHECK (report_type IN ('carbon_footprint', 'solar_savings', 'waste_impact', 'water_usage', 'custom')),
    title TEXT NOT NULL,
    summary_data JSONB, -- Store the original calculation data
    
    -- Multi-language audio tracks
    available_languages TEXT[] DEFAULT ARRAY['en'],
    
    -- Status
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error')),
    
    -- Shareable link
    share_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_climate_reports_user_id ON climate_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_climate_reports_status ON climate_reports(status);
CREATE INDEX IF NOT EXISTS idx_climate_reports_report_type ON climate_reports(report_type);

-- =====================================================
-- Video Analytics Table
-- Custom Mux Data analytics events
-- =====================================================
CREATE TABLE IF NOT EXISTS video_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Video reference
    video_id UUID REFERENCES climate_videos(id) ON DELETE CASCADE,
    playback_id TEXT,
    
    -- Viewer info
    viewer_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Custom dimensions
    climate_topic TEXT,
    user_region TEXT,
    feature_used TEXT,
    
    -- Watch metrics
    view_start TIMESTAMPTZ DEFAULT NOW(),
    view_end TIMESTAMPTZ,
    watch_time_seconds INTEGER,
    completion_percentage NUMERIC,
    
    -- Quality metrics
    startup_time_ms INTEGER,
    rebuffer_count INTEGER,
    rebuffer_duration_ms INTEGER,
    
    -- Device info
    device_type TEXT,
    browser TEXT,
    country TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_playback_id ON video_analytics(playback_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_created_at ON video_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analytics_climate_topic ON video_analytics(climate_topic);
CREATE INDEX IF NOT EXISTS idx_video_analytics_user_region ON video_analytics(user_region);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE climate_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;

-- Climate Videos Policies
CREATE POLICY "Anyone can view ready videos"
    ON climate_videos FOR SELECT
    USING (status = 'ready');

CREATE POLICY "Users can insert their own videos"
    ON climate_videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
    ON climate_videos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
    ON climate_videos FOR DELETE
    USING (auth.uid() = user_id);

-- Live Streams Policies
CREATE POLICY "Anyone can view active streams"
    ON live_streams FOR SELECT
    USING (status IN ('idle', 'active'));

CREATE POLICY "Users can insert their own streams"
    ON live_streams FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streams"
    ON live_streams FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streams"
    ON live_streams FOR DELETE
    USING (auth.uid() = user_id);

-- Climate Reports Policies
CREATE POLICY "Users can view their own reports"
    ON climate_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
    ON climate_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Video Analytics Policies (more restrictive)
CREATE POLICY "Users can view their own analytics"
    ON video_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics"
    ON video_analytics FOR INSERT
    WITH CHECK (true); -- Will be restricted to service role key

-- =====================================================
-- Updated At Trigger Function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_climate_videos_updated_at
    BEFORE UPDATE ON climate_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_streams_updated_at
    BEFORE UPDATE ON live_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_climate_reports_updated_at
    BEFORE UPDATE ON climate_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample Data for Testing (Optional)
-- =====================================================
-- Uncomment to insert test data
/*
INSERT INTO climate_videos (
    mux_asset_id, playback_id, title, description,
    status, latitude, longitude, location_name,
    climate_topic, tags
) VALUES (
    'test-asset-001', 'test-playback-001',
    'Monsoon Season in Maharashtra',
    'Documenting the early arrival of monsoon rains and its impact on local farming',
    'ready', 19.0760, 72.8777, 'Mumbai, India',
    'weather', ARRAY['monsoon', 'farming', 'india']
);
*/
