# Pollinations Prompt Studio

A tiny, hand-rolled image studio that turns a one-line idea into a picture with
[Pollinations](https://pollinations.ai). Generation goes through the
[`gen.pollinations.ai/image`](https://gen.pollinations.ai/docs) endpoint with
**BYOP** (Bring Your Own Pollen): the studio sends a
`Authorization: Bearer <your key>` request carrying your own pollen, so the render
draws on your own balance. Built with plain HTML / CSS / JavaScript — no framework,
no bundler, no build step. No developer secret is embedded anywhere; the key you paste
stays in your browser session only.

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

**App page**

```html
<a href="https://pollinations.ai/?ref=badge"><img src="https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg" alt="Made with pollinations.ai"></a>
```

---

## What it does

- **One-line prompt → image.** Generates through
  `GET https://gen.pollinations.ai/image/{prompt}?width=…&height=…&model=…&seed=…`
  carrying your own key (`Authorization: Bearer <your key>`).
- **Live model catalog.** Loads `GET https://gen.pollinations.ai/v1/models`, an
  unauthenticated public call, and lists image-capable models so you can pick the
  model for the render.
- **Ratio presets** (square / landscape / portrait / content / wide), seed, enhance,
  and watermark control.
- **Copy prompt / copy image URL / download.**
- **Local history** (last 8, in `localStorage`) with click-to-reload.
- **Optional prompt refinement** via a text model, using **your own** Pollinations
  secret key — never stored anywhere but this browser.

## Quick start

Needs Node.js 18+. No dependencies.

```bash
node server.js
# open http://127.0.0.1:8788
```

Then open **API key**, paste your own Pollinations secret key (`sk_…`, from
[enter.pollinations.ai](https://enter.pollinations.ai/keys)), type a prompt and press
**Generate with Pollinations**.

You can also open `index.html` directly in a browser (the catalog call needs
`fetch`, which works from a local page in most modern browsers).

## BYOP (Bring Your Own Pollen)

Open **API key** and paste your own Pollinations secret key (`sk_…`, get one at
[enter.pollinations.ai](https://enter.pollinations.ai/keys)). With it set:

- image generation sends a **BYOP** request to `gen.pollinations.ai/image` so the
  render draws on your own pollen;
- *Refine* rewrites rough ideas into detailed image prompts through a text model.

The key is stored only in your browser's `localStorage`, and is sent only to
Pollinations as `Authorization: Bearer`. No developer, app or user key is
hardcoded in the repository.

## Where it calls Pollinations

| What | Endpoint |
|---|---|
| Generate an image | `GET https://gen.pollinations.ai/image/{prompt}?width=…&height=…&model=…&seed=…` with `Authorization: Bearer <your key>` |
| Model catalog | `GET https://gen.pollinations.ai/v1/models` (public, no key) |
| Refine (optional) | `GET https://gen.pollinations.ai/text/{prompt}?model=…` with `Authorization: Bearer <your key>` |

Nothing else is contacted. The app does not use any third-party service or CDN.

## boundaries

- Prompts and images are visible to the upstream model provider — don't paste
  private data.
- Rendering requires your own Pollinations key (BYOP). If the request is rejected,
  the studio shows the `HTTP status` so you can re-check the key.
- The catalog call fails gracefully; the studio falls back to the default image
  model and still generates.

## License

MIT — see the repo root. Built with [Pollinations](https://pollinations.ai).
