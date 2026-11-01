# EDUCORE by Ahmad

Learn Skills. Build Knowledge. Create Opportunities.

A learning platform built with plain HTML, CSS and JavaScript, using Supabase for authentication, database and Row Level Security. Hosted on GitHub Pages.

Live site: https://ahmadcrt.github.io/educore/

## Features

**Students**
- Register, log in, log out and reset password (Supabase Auth)
- Browse and search courses, filter by academy
- Enrol in courses and open lessons
- Mark lessons as completed and track progress
- Take quizzes and see scores
- Earn a certificate when every lesson in a course is completed
- Personal dashboard with courses, progress, quiz results and certificates

**Admins**
- Create, edit, publish/unpublish and delete courses
- Add and remove modules and lessons
- Create quizzes and questions
- View students and enrolments

## Project structure

    educore/
    ├── index.html, about.html, contact.html, courses.html, course-details.html
    ├── login.html, register.html, dashboard.html
    ├── certificate.html, quiz.html
    ├── admin.html, admin-quizzes.html
    ├── css/style.css
    ├── js/ config.js, supabase.js, auth.js, main.js, courses.js,
    │      dashboard.js, certificate.js, quiz.js, admin.js, admin-quizzes.js
    └── database/ SQL files

## Setup

1. Create a project at supabase.com.
2. In the SQL Editor, run the database scripts in this order:
   1. `schema.sql` (tables, security policies, sample courses)
   2. the profile policy and sample modules/lessons script
   3. the certificate function (`issue_certificate`)
   4. the quiz functions (`get_quiz_questions`, `submit_quiz`)
3. In Project Settings > API, copy the Project URL and the publishable (anon) key into `js/config.js`.
4. In Authentication > URL Configuration, set the Site URL to `https://ahmadcrt.github.io/educore/`.
5. Register an account on the site, then make it an admin in the SQL Editor:

       update profiles set role='admin' where id=(select id from auth.users where email='YOUR-EMAIL');

## Deployment

Push the files to the `main` branch of the `educore` repository. In Settings > Pages, choose Deploy from branch: `main`, folder `/ (root)`. File and folder names are case-sensitive: use lowercase `js/` and `css/`.

## Security

- Only the publishable key is used in the frontend. The service-role key must never be added to this repository.
- Row Level Security is enabled on every table. Admin access is decided by the `profiles.role` value in the database, not by anything in the browser.
- Students cannot read quiz answers or write their own scores or certificates. Marking and certificate issuing happen in database functions that check enrolment and progress.
- Admin pages check the role on load, and the database policies refuse admin actions from non-admin accounts.

## Not built yet

- Homepage testimonials, instructors and how-it-works sections
- Student profile editing
- A dedicated lesson viewer page (lessons currently open inside the course page)
- Resume from the exact last lesson (Resume opens the course)

## Notes

Sample course content and instructor names are demo data.
