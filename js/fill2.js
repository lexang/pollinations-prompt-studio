async (page) => {
  const out = {};
  const shot = 'D:\\workspace\\Cue\\pollinations-prompt-studio\\screenshots\\app.png';
  const formUrl = 'https://github.com/pollinations/pollinations/issues/new?template=app-submission.yml';

  // locate the issue-form tab deterministically
  const pages = page.context().pages();
  out.tabCount = pages.length;
  let form = pages.find((p) => /app-submission.yml/.test(p.url()));
  if (!form) {
    return { error: 'form page not found', tabs: pages.map((p) => p.url()) };
  }
  out.formUrlBefore = form.url();

  try {
    await form.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await form.waitForFunction(() => document.body.innerText.includes('App Category'), null, { timeout: 90000 });
    out.ready = true;
  } catch (e) {
    out.error = String(e && e.message ? e.message : e).slice(0, 300);
    return out;
  }

  const name = 'Pollinations Prompt Studio';
  const description = 'Prompt-to-image studio using the free image.pollinations.ai endpoint. Pure HTML/CSS/JS, no framework. Includes ratio presets, seeds, model catalog and prompt refinement with your own key.';

  const titleLoc = form.locator('input[aria-label="Add a title"]').first();
  const appNameLoc = form.locator('input[placeholder^="Sunflower Studio"]').first();
  const descLoc = form.locator('textarea[placeholder^="Creates collaborative"]').first();
  const appUrlLoc = form.locator('input[placeholder^="https://example.com"]').first();
  const repoUrlLoc = form.locator('input[placeholder^="https://github.com/username/repository"]').first();

  await titleLoc.waitFor({ state: 'visible', timeout: 30000 });
  await appNameLoc.waitFor({ state: 'visible', timeout: 30000 });
  await descLoc.waitFor({ state: 'visible', timeout: 30000 });
  await appUrlLoc.waitFor({ state: 'visible', timeout: 30000 });
  await repoUrlLoc.waitFor({ state: 'visible', timeout: 30000 });

  await titleLoc.fill(name);
  await appNameLoc.fill(name);
  await descLoc.fill(description);
  await appUrlLoc.fill('https://lexang.github.io/pollinations-prompt-studio/');
  await repoUrlLoc.fill('https://github.com/lexang/pollinations-prompt-studio');
  out.filled = true;

  // App Language -> first bare text input (subsequent bare inputs are optional)
  const bareInputs = form.locator('input:visible:not([placeholder]):not([type=checkbox]):not([type=hidden])');
  const bareCount = await bareInputs.count();
  out.bareCount = bareCount;
  if (bareCount >= 1) {
    await bareInputs.nth(0).fill('en');
    out.langFilled = true;
  }

  // dropdown displays
  out.boxTexts = await form.evaluate(() => {
    return [...document.querySelectorAll('.dropdownElementContainer__jbQOkl button')].map((b) => b.textContent.trim());
  });

  // screenshot upload via 2nd paste button
  const pasteButtons = form.locator('button.pasteButton__cJqVky');
  const pasteCount = await pasteButtons.count();
  out.pasteCount = pasteCount;
  if (pasteCount > 0) {
    const target = pasteCount > 1 ? pasteButtons.nth(1) : pasteButtons.first();
    const fcPromise = form.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    await target.click();
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([shot]);
      out.screenshot = 'uploaded';
    } else {
      const fi = form.locator('input[type=file]');
      const n = await fi.count();
      if (n > 0) { await fi.setFiles([shot]); out.screenshot = 'uploaded-via-input'; }
      else { out.screenshot = 'FAILED'; }
    }
  }

  await form.waitForTimeout(4000);

  out.state = await form.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const t = q('input[aria-label="Add a title"]');
    const a = q('textarea[placeholder^="Creates collaborative"]');
    const u = q('input[placeholder^="https://example.com"]');
    const g = q('input[placeholder^="https://github.com/username/repository"]');
    const preview = Array.from(document.querySelectorAll('img'))
      .filter((i) => i.naturalWidth > 100 && /pollinations|github|objects|user-images/.test(i.src))
      .map((i) => ({ src: i.src.slice(0, 70), r: Math.round(i.getBoundingClientRect().width), nat: i.naturalWidth }));
    return {
      title: t && t.value,
      descLen: a ? a.value.length : 0,
      url: u && u.value,
      repo: g && g.value,
      fileInputs: document.querySelectorAll('input[type=file]').length,
      errors: (document.body.innerText.match(/(?:cannot be used|is required|too big|not supported|An error occurred)[^.]{0,40}/gi) || []).slice(0, 8),
      preview
    };
  });

  out.completed = await form.title();
  return out;
}
