async (page) => {
  const out = {};
  const shot = 'D:\\workspace\\Cue\\pollinations-prompt-studio\\screenshots\\app.png';
  const formUrl = 'https://github.com/pollinations/pollinations/issues/new?template=app-submission.yml';

  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  out.url = page.url();
  out.title = await page.title();

  // wait for form to be ready
  await page.waitForFunction(() => document.body.innerText.includes('App Category'), null, { timeout: 90000 });
  out.ready = true;

  const name = 'Pollinations Prompt Studio';
  const description = 'Prompt-to-image studio using the free image.pollinations.ai endpoint. Pure HTML/CSS/JS, no framework. Includes ratio presets, seeds, model catalog and optional prompt refinement with your own key.';

  const titleLoc = page.locator('input[aria-label="Add a title"]').first();
  const appNameLoc = page.locator('input[placeholder^="Sunflower Studio"]').first();
  const descLoc = page.locator('textarea[placeholder^="Creates collaborative"]').first();
  const appUrlLoc = page.locator('input[placeholder^="https://example.com"]').first();
  const repoUrlLoc = page.locator('input[placeholder^="https://github.com/username/repository"]').first();
  const langLoc = page.locator('input:visible:not([placeholder]):not([type=checkbox]):not([type=hidden])').first();

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

  const bareInputs = page.locator('input:visible:not([placeholder]):not([type=checkbox]):not([type=hidden])');
  const bareCount = await bareInputs.count();
  if (bareCount >= 1) {
    // the first such input is App Language; the following ones are Discord/Quest (leave empty)
    await bareInputs.nth(0).fill('en');
  }
  out.bareInputs = bareCount;

  // category / platform current values
  const readDD = (re) => page.evaluate((rx) => {
    const labels = [...document.querySelectorAll('label')];
    const l = labels.find((x) => new RegExp(rx).test(x.textContent));
    const box = l ? l.closest('.dropdownElementContainer__jbQOkl') : null;
    const b = box ? box.querySelector('button') : null;
    return b ? b.textContent.trim() : null;
  }, re);
  out.category = await readDD('App Category');
  out.platform = await readDD('Platform');

  // screenshot upload
  const pasteButtons = page.locator('button.pasteButton__cJqVky');
  const pasteCount = await pasteButtons.count();
  out.pasteButtons = pasteCount;
  if (pasteCount > 0) {
    // the description editor's button is first; Screenshot field's is second
    const target = pasteCount > 1 ? pasteButtons.nth(1) : pasteButtons.first();
    const fcPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    await target.click();
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([shot]);
      out.screenshot = 'uploaded-via-filechooser';
    } else {
      const fileInputs = page.locator('input[type=file]');
      const n = await fileInputs.count();
      if (n > 0) {
        await fileInputs.setFiles([shot]);
        out.screenshot = 'uploaded-via-input';
      } else {
        out.screenshot = 'FAILED-no-file-input';
      }
    }
  }

  await page.waitForTimeout(4000);

  out.valueAfter = await page.evaluate(() => {
    const t = document.querySelector('input[aria-label="Add a title"]');
    const n = document.querySelector('input[placeholder^="Sunflower Studio"]');
    const d = document.querySelector('textarea[placeholder^="Creates collaborative"]');
    const u = document.querySelector('input[placeholder="https://example.com"]');
    const r = document.querySelector('input[placeholder="https://github.com/username/repository"]');
    return {
      title: t && t.value,
      appName: n && n.value,
      descLen: d ? d.value.length : null,
      appUrl: u && u.value,
      repoUrl: r && r.value,
      errors: (document.body.innerText.match(/required|error|cannot|too big|not supported/gi) || []).slice(0, 10)
    };
  });

  // screenshot preview
  out.previewSrc = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('label')];
    const l = labels.find((x) => /Screenshot/.test(x.textContent));
    const wrap = l ? l.closest('.elementWrapperContainer__HL-k9p') : null;
    const img = wrap ? wrap.querySelector('img') : null;
    return img ? { src: img.src.slice(0, 80), w: img.naturalWidth, h: img.naturalHeight } : null;
  });

  out.category = out.category;
  out.platform = out.platform;
  return out;
}
