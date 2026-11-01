-- EDUCORE schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table profiles(id uuid primary key references auth.users on delete cascade,full_name text,role text not null default 'student' check(role in('student','admin')),created_at timestamptz default now());
create table courses(id uuid primary key default gen_random_uuid(),title text not null,description text,academy text not null check(academy in('Technology & Programming','Financial Markets & Trading','Digital Business & Marketing')),level text not null default 'Beginner' check(level in('Beginner','Intermediate','Advanced')),instructor text,duration_hours int check(duration_hours>0),objectives text[],published boolean default false,created_at timestamptz default now());
create table modules(id uuid primary key default gen_random_uuid(),course_id uuid not null references courses on delete cascade,title text not null,position int not null default 0);
create table lessons(id uuid primary key default gen_random_uuid(),module_id uuid not null references modules on delete cascade,title text not null,content text,position int not null default 0);
create table enrollments(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles on delete cascade,course_id uuid not null references courses on delete cascade,enrolled_at timestamptz default now(),unique(user_id,course_id));
create table lesson_progress(user_id uuid not null references profiles on delete cascade,lesson_id uuid not null references lessons on delete cascade,completed_at timestamptz default now(),primary key(user_id,lesson_id));
create table quizzes(id uuid primary key default gen_random_uuid(),module_id uuid not null references modules on delete cascade,title text not null,pass_mark int not null default 70 check(pass_mark between 0 and 100));
create table quiz_questions(id uuid primary key default gen_random_uuid(),quiz_id uuid not null references quizzes on delete cascade,question text not null,options jsonb not null,correct_index int not null);
create table quiz_attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles on delete cascade,quiz_id uuid not null references quizzes on delete cascade,score int not null check(score between 0 and 100),created_at timestamptz default now());
create table certificates(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles on delete cascade,course_id uuid not null references courses on delete cascade,issued_at timestamptz default now(),unique(user_id,course_id));
create index on modules(course_id);create index on lessons(module_id);create index on enrollments(user_id);create index on lesson_progress(user_id);create index on quiz_attempts(user_id);

create function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name');return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security;alter table courses enable row level security;alter table modules enable row level security;alter table lessons enable row level security;alter table enrollments enable row level security;alter table lesson_progress enable row level security;alter table quizzes enable row level security;alter table quiz_questions enable row level security;alter table quiz_attempts enable row level security;alter table certificates enable row level security;

create policy "own or admin read" on profiles for select using(id=auth.uid() or is_admin());
create policy "own update, no role change" on profiles for update using(id=auth.uid()) with check(id=auth.uid() and role=(select role from profiles where id=auth.uid()));
create policy "admin manage profiles" on profiles for all using(is_admin()) with check(is_admin());
create policy "read published" on courses for select using(published or is_admin());
create policy "admin courses" on courses for all using(is_admin()) with check(is_admin());
create policy "read modules" on modules for select using(exists(select 1 from courses c where c.id=course_id and(c.published or is_admin())));
create policy "admin modules" on modules for all using(is_admin()) with check(is_admin());
create policy "read lessons" on lessons for select using(exists(select 1 from modules m join enrollments e on e.course_id=m.course_id where m.id=module_id and e.user_id=auth.uid()) or is_admin());
create policy "admin lessons" on lessons for all using(is_admin()) with check(is_admin());
create policy "read quizzes" on quizzes for select using(auth.uid() is not null);
create policy "admin quizzes" on quizzes for all using(is_admin()) with check(is_admin());
create policy "read questions" on quiz_questions for select using(auth.uid() is not null);
create policy "admin questions" on quiz_questions for all using(is_admin()) with check(is_admin());
create policy "own enrollments" on enrollments for select using(user_id=auth.uid() or is_admin());
create policy "enrol self" on enrollments for insert with check(user_id=auth.uid());
create policy "own progress" on lesson_progress for select using(user_id=auth.uid() or is_admin());
create policy "mark own progress" on lesson_progress for insert with check(user_id=auth.uid());
create policy "own attempts" on quiz_attempts for select using(user_id=auth.uid() or is_admin());
create policy "record own attempt" on quiz_attempts for insert with check(user_id=auth.uid());
create policy "own certs" on certificates for select using(user_id=auth.uid() or is_admin());

insert into courses(title,description,academy,level,instructor,duration_hours,published) values
('Web Development Foundations','Build responsive sites with HTML, CSS and JavaScript.','Technology & Programming','Beginner','Sample Instructor',20,true),
('Forex Trading Essentials','Currency pairs, order types and market structure.','Financial Markets & Trading','Beginner','Sample Instructor',12,true),
('Risk Management for Traders','Position sizing, stop placement and drawdown control.','Financial Markets & Trading','Intermediate','Sample Instructor',8,true),
('Digital Marketing Fundamentals','Channels, funnels and measuring campaigns.','Digital Business & Marketing','Beginner','Sample Instructor',10,true);
-- Make yourself admin: update profiles set role='admin' where id='<your-user-id>';
