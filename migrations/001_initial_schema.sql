-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- profiles table (linked to auth.users)
CREATE TABLE profiles (
  id uuid references auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  email text,
  bio text,
  avatar_url text,
  role text default 'admin',
  social_links jsonb,
  created_at timestamptz default now()
);

-- trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (new.id, new.email, split_part(new.email, '@', 1), 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY default gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  featured_image text,
  author_id uuid references profiles(id) ON DELETE SET NULL,
  status text default 'draft', -- published | draft | scheduled
  scheduled_at timestamptz,
  views integer default 0,
  comments_count integer default 0,
  is_featured boolean default false,
  allow_comments boolean default true,
  seo_title text,
  meta_description text,
  og_image text,
  focus_keyword text,
  search_vector tsvector GENERATED ALWAYS AS
    (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(excerpt,'')))
    STORED,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- post_revisions table
CREATE TABLE post_revisions (
  id uuid PRIMARY KEY default gen_random_uuid(),
  post_id uuid references posts(id) ON DELETE CASCADE,
  content text,
  saved_at timestamptz default now()
);

-- categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY default gen_random_uuid(),
  name text,
  slug text UNIQUE,
  description text,
  parent_id uuid references categories(id) ON DELETE SET NULL,
  accent_color text,
  cover_image text,
  display_order integer default 0,
  post_count integer default 0
);

-- post_categories (junction)
CREATE TABLE post_categories (
  post_id uuid references posts(id) ON DELETE CASCADE,
  category_id uuid references categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- tags table
CREATE TABLE tags (
  id uuid PRIMARY KEY default gen_random_uuid(),
  name text,
  slug text UNIQUE,
  post_count integer default 0
);

-- post_tags (junction)
CREATE TABLE post_tags (
  post_id uuid references posts(id) ON DELETE CASCADE,
  tag_id uuid references tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY default gen_random_uuid(),
  post_id uuid references posts(id) ON DELETE CASCADE,
  parent_id uuid references comments(id) ON DELETE CASCADE,
  name text,
  email text,
  content text,
  status text default 'pending', -- pending | approved | spam
  is_reported boolean default false,
  created_at timestamptz default now()
);

-- subscribers table
CREATE TABLE subscribers (
  id uuid PRIMARY KEY default gen_random_uuid(),
  email text UNIQUE,
  unsubscribe_token text UNIQUE,
  is_active boolean default true,
  subscribed_at timestamptz default now()
);

-- messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY default gen_random_uuid(),
  name text,
  email text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- media table
CREATE TABLE media (
  id uuid PRIMARY KEY default gen_random_uuid(),
  filename text,
  url text,
  thumbnail_url text,
  medium_url text,
  size integer,
  type text,
  uploaded_at timestamptz default now()
);

-- page_views table
CREATE TABLE page_views (
  id uuid PRIMARY KEY default gen_random_uuid(),
  post_id uuid references posts(id) ON DELETE CASCADE,
  view_date date,
  count integer default 1,
  UNIQUE (post_id, view_date)
);

-- settings table
CREATE TABLE settings (
  key text PRIMARY KEY,
  value text
);

-- login_attempts table
CREATE TABLE login_attempts (
  id uuid PRIMARY KEY default gen_random_uuid(),
  email text,
  attempted_at timestamptz default now(),
  ip_address text
);

-- Indexes
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_search_vector ON posts USING GIN (search_vector);
CREATE INDEX idx_comments_post_status ON comments(post_id, status);
CREATE INDEX idx_page_views_post_date ON page_views(post_id, view_date);
CREATE INDEX idx_post_categories_category ON post_categories(category_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- RLS Setup
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published posts
CREATE POLICY "Public can view published posts" ON posts FOR SELECT
USING (status = 'published');

-- Allow public read access to approved comments
CREATE POLICY "Public can view approved comments" ON comments FOR SELECT
USING (status = 'approved');

-- Allow public read access to media, categories, tags, settings
CREATE POLICY "Public can view media" ON media FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public can view profiles" ON profiles FOR SELECT USING (true);

-- Seed initial settings
INSERT INTO settings (key, value) VALUES
  ('blog_name_en', 'Malayalam Blog'),
  ('blog_name_ml', 'മലയാളം ബ്ലോഗ്'),
  ('tagline', 'എല്ലാ പുതിയ വിവരങ്ങളും ഇവിടെ വായിക്കുക'),
  ('footer_text', '© 2026 Malayalam Blog. All rights reserved.'),
  ('posts_per_page', '10'),
  ('maintenance_mode', 'false'),
  ('maintenance_message', 'ഞങ്ങൾ ഇപ്പോൾ അറ്റകുറ്റപ്പണികളിലാണ്. ദയവായി കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.'),
  ('accent_color', '#f5a623')
ON CONFLICT (key) DO NOTHING;
