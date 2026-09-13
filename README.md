# Flow Fusion marketing site

Single-page marketing site for Flow Fusion, a CRM + SMS product built on GoHighLevel. All markup, CSS, and JavaScript are scoped to a single `#ff-site` element so the whole page can be pasted into a GoHighLevel custom-code block without fighting the host page's styles.

## Layout

- `src/site.html` - the `#ff-site` markup fragment
- `src/styles.base.css` and `src/styles.sections.css` - stylesheet, concatenated in that order at build time
- `src/site.js` - behaviour: demo walkthrough, mobile nav, scroll progress line, reveal-on-scroll, reduce-motion toggle, plan dialog
- `assets/logo.png` - the brand logo (1904x1967 PNG). Not committed yet; see "Adding the logo"
- `scripts/build.mjs` - the build script (Node 18+, no dependencies)
- `package.json` - `build` and `placeholder` scripts

Build outputs:

- `index.html` - standalone page for local preview or any static host; references `dist/styles.css`, `dist/site.js`, and `assets/logo.png`
- `dist/ghl-embed.html` - one self-contained snippet for GoHighLevel, with the logo inlined as a data URI
- `dist/styles.css`, `dist/site.js` - the built stylesheet and script

## Quick start

```
npm run build
npx serve .
```

Then open the URL that `serve` prints. `python3 -m http.server` works too if you prefer not to use npx. Opening `index.html` straight from the filesystem also works for a quick look, but a local server is closer to how the page behaves when hosted.

If `assets/logo.png` is missing, the build falls back to `assets/logo.placeholder.png` and prints a warning.

## Embedding in GoHighLevel

1. Run `npm run build`.
2. Open `dist/ghl-embed.html` and copy its entire contents.
3. In the GoHighLevel funnel or website builder, add a Custom Code / Custom HTML element to the page and paste the snippet into it.
4. Save and publish the page.

The snippet is self-contained: styles, script, and logo are all inside it, so nothing else needs to be uploaded. Every selector is namespaced under `#ff-site`, and the script only runs against that element, so GHL's own styles and scripts are left alone.

The pasted snippet does not update itself. After every rebuild (copy changes, checkout links, logo), copy `dist/ghl-embed.html` again and replace the contents of the custom code element.

## Connecting checkout

At the top of `src/site.js` is this object:

```js
const checkoutLinks = { core: '', starter: '', growth: '', scale: '' };
```

It is intentionally empty. While a value is empty, the matching "Choose ..." button opens a "Website preview" dialog that describes the plan and states that no payment is collected. Nothing is charged and no account is created.

To go live, paste the approved GoHighLevel checkout URL for each plan into the object, rebuild, and re-paste the embed. Only `https:` URLs are honoured; anything else (including `http:` or a malformed value) is ignored and the preview dialog is shown instead.

## Adding the logo

Drop the real PNG at `assets/logo.png` and rebuild. `index.html` references the file directly; `dist/ghl-embed.html` embeds it as a data URI so the GHL snippet has no external image dependency. Until the file exists, the build uses `assets/logo.placeholder.png` and warns about it.

## Plans

As currently coded:

| Plan    | Price    | Includes                                  | Notes       |
|---------|----------|-------------------------------------------|-------------|
| Core    | $99/mo   | CRM only, no SMS                          |             |
| Starter | $150/mo  | CRM + 5,000 SMS per month + 1 SMS number  |             |
| Growth  | $297/mo  | CRM + 25,000 SMS per month + 1 SMS number | Recommended |
| Scale   | $497/mo  | CRM + 50,000 SMS per month + 1 SMS number |             |

Additional SMS numbers are $5 each per month. Sent and received messages both count toward the allowance. SMS is provided by TextVolt and covers messaging only, not calling.

Plan copy lives in two places and must be kept in sync by hand:

- `src/site.html` - the pricing cards (`.ff-plan` articles), the hero price note, the FAQ answers, and the pricing notes
- `src/site.js` - the `plans` object (`name`, `price`, `includes`) that fills the preview dialog

If a price or allowance changes, update both, then rebuild.

## Accessibility and motion

- A "Reduce motion" button in the footer disables all animation and transitions inside `#ff-site`, stops the demo walkthrough, and switches in-page scrolling to instant. Its state is exposed with `aria-pressed`.
- The OS-level `prefers-reduced-motion` setting is respected automatically, both in CSS and in the script, and the page follows changes to it while open.
- The demo walkthrough has its own pause/play/replay control, only animates while it is on screen and the tab is visible, and can always be stepped through manually with the three stage buttons.
- A "Skip to content" link is the first focusable element and becomes visible on focus.
- The mobile navigation menu closes on Escape (returning focus to the toggle) and on clicks outside it. The plan dialog is a native `<dialog>`, so Escape closes it; clicking the backdrop closes it too.
- In-page links move focus to their target section, and all interactive elements have a visible focus ring.

## Deploying to Vercel

The repo includes a `vercel.json` that tells Vercel to run `npm run build` and serve the `public/` folder it produces. Import the GitHub repo in Vercel, set the production branch to the branch you want live (currently `claude/zen-sagan-xnyaf3`), and deploy. No framework preset or environment variables are needed. Every push to that branch redeploys automatically, so tweaks go live on the domain within a minute or two.

## Checkout pages

Each plan has its own page at `/checkout/<plan>` (`core`, `starter`, `growth`, `scale`), generated at build time from `src/checkout/template.html` and `src/checkout/plans.json`. The "Choose ..." buttons on the pricing grid link to them. Put the GoHighLevel form embed for a plan in its `form` field in `plans.json` (the `<iframe ...>` only; the `form_embed.js` script is already on the page). A plan with an empty `form` shows a "checkout is almost ready" notice instead of a form.
