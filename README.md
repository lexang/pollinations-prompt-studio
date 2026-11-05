# Pollinations Prompt Studio

A tiny, hand-rolled image studio that turns a one-line idea into a picture using
[Pollinations](https://pollinations.ai) — with **no account required** for image
generation. Type a prompt, press generate, get an image rendered on Pollinations
model infrastructure.

Built with plain HTML / CSS / JavaScript. No framework, no bundler, no build step.

![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)

---

## What it does

- **One-line prompt → image.** Generates through the free `image.pollinations.ai`
  endpoint; the UI itself needs **no API key**.
- **Live model catalog.** Loads `GET https://gen.pollinations.ai/v1/models` and lists
  image-capable models, so you can pick the model for the render.
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

Then type a prompt and press **Generate with Pollinations**.

You can also open `index.html` directly in a browser (the catalog call needs
`fetch`, which works from a local page in most modern browsers).

## Using your own key (optional)

Image generation never needs a key. If you want the *Refine* button to rewrite
rough ideas into detailed image prompts, open **API key**, paste a Pollinations
secret key (`sk_…`, get one at [enter.pollinations.ai](https://enter.pollinations.ai/keys)),
then press **Refine**. The key is stored only in your browser's `localStorage`.

## Where it calls Pollinations

| What | Endpoint |
|---|---|
| Generate an image | `GET https://image.pollinations.ai/prompt/{prompt}?width=…&height=…&model=…&seed=…` |
| Model catalog | `GET https://gen.pollinations.ai/v1/models` |
| Refine (optional) | `GET https://gen.pollinations.ai/text/{prompt}?model=…` with `Authorization: Bearer <your key>` |

Nothing else is contacted. The app does not use any third-party service or CDN.

## boundaries

- Prompts and images are visible to the upstream model provider — don't paste
  private data.
- The catalog call fails gracefully; the studio falls back to the default image
  model and still generates.

## License

MIT — see the repo root. Built with [Pollinations](https://pollinations.ai).
