# Deploying Waffle — FREE, no credit card required

The hackathon requires deployment on **Cloud Run / GCP / Firebase**. Cloud Run and Cloud Functions need a billing account (credit card). **Firebase Hosting on the Spark plan does NOT** — it's free with no payment info. That's our target.

> Requirement met: "deployed on Google Cloud via Cloud Run **or** Firebase." ✅

## Option A — Firebase Hosting console (no CLI, no install) ✅ recommended

Easiest path if you have no Node installed.

1. **Get a free Gemini API key** — https://aistudio.google.com/apikey (no card).
2. Go to https://console.firebase.google.com → **Add project** (Blaze *not* needed; stay on **Spark**). Name it `Waffle`.
3. In the project: **Build → Hosting → Get started**.
4. Choose **"Manually upload a folder"** (or install the CLI if prompted — see Option B).
5. When it asks for the public folder, drag/select this `Waffle` folder.
6. Deploy. You get a live URL like `https://Waffle-xxxx.web.app`. ✅

> If the console insists on the CLI, use Option B — it's one command.

## Option B — Firebase CLI (one-time install)

```bash
# Install Firebase CLI (no sudo needed)
npm install -g firebase-tools

# Log in (opens browser, free Google account)
firebase login

# From inside the Waffle/ folder, init hosting
firebase init hosting
#   - Select your project (create in console first)
#   - Public directory: .   (a single dot = this folder)
#   - Single-page app: No
#   - Overwrite index.html: No

# Deploy
firebase deploy --only hosting
```

Output ends with a live URL. ✅

## Restrict your API key (important, do before sharing the link)

Because the app calls Gemini from the browser, **restrict the key** so nobody else can use it:

1. Go to https://console.cloud.google.com/apis/credentials
2. Edit your key → **Application restrictions** → **Websites** → add your Firebase domain:
   - `https://Waffle-xxxx.web.app`
   - `https://Waffle-xxxx.firebaseapp.com`
3. Save. Now only your deployed site can use the key.

> For a local demo before deploy, also add `http://localhost:8080`.

## Submission checklist

- [ ] Deployed URL live and working
- [ ] API key restricted to your domain
- [ ] Public GitHub repo pushed
- [ ] 3-minute demo video recorded (script below)
- [ ] Deck exported to PDF
- [ ] Problem statement = **Sustainability & Social Impact**
