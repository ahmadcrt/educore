# EDUCORE by Ahmad
Learn Skills. Build Knowledge. Create Opportunities. Vanilla HTML/CSS/JS + Supabase.

## Setup
1. Create a project at supabase.com.
2. SQL Editor: paste and run `database/schema.sql` (tables, RLS, sample courses).
3. Settings > API: copy Project URL and **anon** key into `js/config.js`. Never use the service-role key in frontend code.
4. Authentication > URL Configuration: add `https://ahmadcrt.github.io/educore/` as Site URL and redirect URL.
5. Register an account, then in SQL Editor: `update profiles set role='admin' where id='<your user id>';`

## Deploy (GitHub Pages)
Push to repo `educore`, then Settings > Pages > Deploy from branch `main` / root.

## Status
Done: public pages, auth (register, login, logout, password reset), course browsing/search, full schema with RLS (admin enforced by `is_admin()` policies).
Not yet built: dashboard, learning/lesson viewer, quizzes UI, certificates, profile page, admin UI, course-details. The database already supports all of them.
