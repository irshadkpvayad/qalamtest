# Malayalam Blog

A full-stack Malayalam blog application built with Node.js, Express, EJS, and Supabase, featuring a Glassmorphism UI.

## Setup Instructions

### 1. Supabase Project Setup
1. Create a new project in [Supabase](https://supabase.com/).
2. Once the project is ready, go to the **SQL Editor**.
3. Copy the contents of `migrations/001_initial_schema.sql` and run it in the SQL Editor to create the necessary tables, indexes, and initial data.

### 2. Configure Storage Buckets
1. Go to **Storage** in the Supabase dashboard.
2. Create a new bucket named `media` and set it to **Public**.
3. Create a new bucket named `avatars` and set it to **Public**.

### 3. Create Admin User
1. Go to **Authentication** -> **Users** in Supabase.
2. Add a new user with your desired admin email (`irshadvayad01@gmail.com`) and password (`#Irshad@100`).
3. Note: The `migrations/001_initial_schema.sql` creates a trigger that automatically adds new users to the `profiles` table with the `admin` role.

### 4. Local Setup
1. Clone the repository and navigate into the folder.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env` and fill in your Supabase credentials, DB URL, Session Secret, SMTP details, etc.
   - You can find the database connection string in Supabase under **Project Settings** -> **Database**.
   - You can find the URL, Anon Key, and Service Role Key under **Project Settings** -> **API**.
4. Run `npm run dev` to start the development server.

### 5. Deployment
- The app is ready to be deployed to Render, Railway, or Vercel (using a serverless adapter).
- Make sure to set all the environment variables from `.env` in your hosting provider's dashboard.
