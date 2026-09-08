-- Migration: Income Mode Activation configuration for admin settings
-- Safe to apply in Supabase SQL editor or via `supabase db push`.

-- Insert default income_mode_activation config if not present.
-- Admin can update the value JSON to customize the activation modal.
insert into public.admin_settings (key, value, updated_at)
values (
  'income_mode_activation',
  '{
    "enabled": true,
    "title": "Income Mode চালু করুন",
    "message": "এই নম্বরে ১০০ টাকা Send Money করে Income Mode চালু করুন এবং ইনকাম করুন।",
    "provider": "bKash",
    "number": "017XXXXXXXX",
    "amount": 100,
    "button_text": "Income Mode চালু করুন"
  }'::jsonb,
  now()
)
on conflict (key) do nothing;
