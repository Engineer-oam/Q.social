-- Run this in your Supabase SQL Editor

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  "displayName" TEXT,
  "photoURL" TEXT,
  bio TEXT,
  country TEXT,
  "createdAt" BIGINT NOT NULL,
  "followersCount" INT DEFAULT 0,
  "followingCount" INT DEFAULT 0,
  "isOnboarded" BOOLEAN DEFAULT false,
  interests TEXT[],
  following UUID[]
);

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID REFERENCES profiles(id) NOT NULL,
  content TEXT,
  "mediaUrls" TEXT[],
  "createdAt" BIGINT NOT NULL,
  "likesCount" INT DEFAULT 0,
  "commentsCount" INT DEFAULT 0,
  "sharesCount" INT DEFAULT 0
);

CREATE TABLE hides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID REFERENCES profiles(id),
  "targetId" UUID
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hides ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts." ON posts FOR INSERT WITH CHECK (auth.uid() = "userId");
