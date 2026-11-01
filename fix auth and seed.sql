-- Run once in Supabase SQL Editor (safe to re-run).
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert with check(id=auth.uid() and role='student');
-- Create missing profiles for accounts made before the trigger existed
insert into profiles(id,full_name) select id,raw_user_meta_data->>'full_name' from auth.users on conflict do nothing;
-- More courses
insert into courses(title,description,academy,level,instructor,duration_hours,published)
select * from (values
('Python Programming Basics','Variables, loops, functions and small projects.','Technology & Programming','Beginner','Sample Instructor',16,true),
('UI/UX Design Essentials','User research, wireframes and visual hierarchy.','Technology & Programming','Beginner','Sample Instructor',14,true),
('Cryptocurrency Markets','How crypto markets work, wallets and market cycles.','Financial Markets & Trading','Beginner','Sample Instructor',9,true),
('Technical Analysis Fundamentals','Trends, support and resistance, indicators.','Financial Markets & Trading','Intermediate','Sample Instructor',11,true),
('Social Media Management','Planning, scheduling and measuring social content.','Digital Business & Marketing','Beginner','Sample Instructor',8,true),
('Freelancing Starter Kit','Find clients, price your work and deliver well.','Digital Business & Marketing','Beginner','Sample Instructor',7,true)
) v(t,d,a,l,i,h,p) where not exists(select 1 from courses c where c.title=v.t);
-- Sample modules and lessons for every course that has none
insert into modules(course_id,title,position) select id,'Getting started',1 from courses c where not exists(select 1 from modules m where m.course_id=c.id);
insert into lessons(module_id,title,content,position) select m.id,'Welcome and overview','Sample lesson content: what you will learn in this course and how to get the most from it.',1 from modules m where not exists(select 1 from lessons l where l.module_id=m.id);
insert into lessons(module_id,title,content,position) select m.id,'Core concepts','Sample lesson content: the key ideas you will use throughout the course.',2 from modules m where (select count(*) from lessons l where l.module_id=m.id)=1;
