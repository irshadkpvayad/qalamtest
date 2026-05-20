-- 1. Update the default user role trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Default to 'user' role instead of 'admin'
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (new.id, new.email, split_part(new.email, '@', 1), 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add user_id to comments table
ALTER TABLE comments ADD COLUMN user_id uuid references profiles(id) ON DELETE CASCADE;

-- 3. Create likes table
CREATE TABLE likes (
  id uuid PRIMARY KEY default gen_random_uuid(),
  post_id uuid references posts(id) ON DELETE CASCADE,
  user_id uuid references profiles(id) ON DELETE CASCADE,
  created_at timestamptz default now(),
  UNIQUE(post_id, user_id) -- A user can only like a post once
);

-- 4. Set up RLS for likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view likes" ON likes FOR SELECT USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Update RLS for comments to allow authenticated users to insert
CREATE POLICY "Users can insert comments" ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Add policy for users to manage their own comments
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments FOR DELETE
USING (auth.uid() = user_id);
