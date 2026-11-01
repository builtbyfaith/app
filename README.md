# Built by Faith App

The Built by Faith member app for **app.built-by-faith.com**: adaptive strength plans, meals, progress, subscriptions and an encouraging, faith-filled AI coach.

## Try it right now (demo mode)
With `js/config.js` left empty, the app runs in demo mode: everything works and is saved in your browser only. Open `index.html` through any local web server, or deploy it to Netlify as-is.

## What's inside
| Path | What it does |
| --- | --- |
| `index.html`, `css/app.css` | The app shell and look |
| `js/content.js` | Programs, exercises, recipes, daily verses and affirmations (edit here) |
| `js/engine.js` | Builds each day's workout, progresses weights, plans meals and the grocery list |
| `js/store.js` | Saves data to Supabase (live) or this browser (demo) |
| `js/app.js` | All screens: sign-up, setup, Today, workout, Eat, Progress, Coach, Profile |
| `js/demo-coach.js` | Offline coach used in demo mode |
| `netlify/functions/coach.js` | The AI coach (OpenAI), with plan check and daily limit |
| `netlify/lib/coach-personality.js` | The coach's personality and safety rules (edit the wording here) |
| `netlify/functions/create-checkout.js`, `stripe-webhook.js`, `customer-portal.js` | Stripe subscriptions with a 7-day free trial |
| `netlify/functions/delete-account.js` | Lets members delete their account and data |
| `supabase/schema.sql` | Database tables and security rules |

## Go live
1. **Supabase:** SQL Editor → paste `supabase/schema.sql` → Run. Authentication → URL Configuration: Site URL `https://app.built-by-faith.com`, and add it to Redirect URLs.
2. **config.js:** paste the Project URL and anon public key from Project Settings → API.
3. **Stripe:** create two monthly prices (Core $7.99, AI Coach $14.99). Add a webhook to `https://app.built-by-faith.com/.netlify/functions/stripe-webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Turn on the Customer portal.
4. **Netlify environment variables** (Site configuration → Environment variables):

| Name | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (keep secret) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → the webhook you created → Signing secret |
| `STRIPE_PRICE_CORE` | Stripe → Core product → price ID (`price_…`) |
| `STRIPE_PRICE_COACH` | Stripe → AI Coach product → price ID |
| `OPENAI_API_KEY` | OpenAI → API keys |
| `OPENAI_MODEL` | Optional. Defaults to `gpt-4o-mini`; set to the smallest current "mini" model |
| `COACH_DAILY_LIMIT` | Optional. Messages per member per day, default 30 |
| `APP_URL` | `https://app.built-by-faith.com` |

5. Push to `builtbyfaith/app`, connect the repo in Netlify, and set the custom domain `app.built-by-faith.com`.

Fitness guidance only, not medical advice.
