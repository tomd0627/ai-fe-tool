# CSS Explainer & Modernizer

A web app that analyzes CSS snippets and explains each property in plain English, flags outdated patterns, and suggests modern alternatives — powered by the Claude AI API.

## What it does

- Paste any CSS snippet and click **Analyze CSS**
- Get a plain-English explanation of each property and value
- Flags outdated techniques (floats, vendor prefixes, IE hacks, etc.) with modern alternatives
- Provides an overall summary of the snippet
- Light/dark theme switcher

## Tech stack

- **Frontend:** React + TypeScript, Vite
- **Serverless function:** Netlify Functions (TypeScript)
- **AI:** Anthropic Claude API (`claude-haiku-4-5`)
- **Hosting:** Netlify

## Local development

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
4. Start the dev server with Netlify Functions:
   ```bash
   npx netlify dev
   ```

## Deployment

The app deploys automatically to Netlify on push to `main`. The `ANTHROPIC_API_KEY` environment variable must be set in the Netlify site settings under **Site configuration → Environment variables**.
