create table if not exists public.user_push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null,
    auth text not null,
    p256dh text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_notification_settings (
    user_id uuid references auth.users(id) on delete cascade primary key,
    notified_field_keys jsonb default '[]'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_push_subscriptions enable row level security;
alter table public.user_notification_settings enable row level security;

create policy "Users can view their own subscriptions"
    on public.user_push_subscriptions for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own subscriptions"
    on public.user_push_subscriptions for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete their own subscriptions"
    on public.user_push_subscriptions for delete
    using ( auth.uid() = user_id );

create policy "Users can view their own notification settings"
    on public.user_notification_settings for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own notification settings"
    on public.user_notification_settings for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own notification settings"
    on public.user_notification_settings for update
    using ( auth.uid() = user_id );
alter table public.user_push_subscriptions add constraint unique_endpoint unique (endpoint);
