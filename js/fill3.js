async (page) => {
  const out = {};
  const shot = 'D:\\workspace\\Cue\\pollinations-prompt-studio\\screenshots\\app.png';
  const formUrl = 'https://github.com/pollinations/pollinations/issues/new?template=app-submission.yml';

  // find the issue-form tab among existing tabs (read-only navigation, no closing/opening)
  const pages = page.context().pages();
  let form = pages.find((p) => /app-submission.yml/.test(p.url()));
  out.tabCount = pages.length;
  out.formFound = !!form;

  // navigate the existing form tab (or the current tab) to a fresh copy of the form
  const target = form || page;
  try {
    await target.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await target.waitForFunction(() => document.body.innerText.includes('App Category'), null, { timeout: 90000 });
    out.ready = true;
  } catch (e) {
    return { error: String(e && e.message ? e.message : e).slice(0, 300), before: out };
  }

  const name = 'Pollinations Prompt Studio';
  const description = 'Prompt-to-image studio using the free image.pollinations.ai endpoint. Pure HTML/CSS/JS, no framework. Includes ratio presets, seeds, model catalog and prompt refinement with your own key.';

  const titleLoc = target.locator('input[aria-label="Add a title"]').first();
  const appNameLoc = target.locator('input[placeholder^="Sunflower Studio"]').first();
  const descLoc = target.locator('textarea[placeholder^="Creates collaborative"]').first();
  const appUrlLoc = target.locator('input[placeholder^="https://example.com"]').first();
  const repoUrlLoc = target.locator('input[placeholder^="https://github.com/username/repository"]').first();

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

  const bareInputs = target.locator('input:visible:not([placeholder]):not([type=checkbox]):not([type=hidden])');
  const bareCount = await bareInputs.count();
  out.bareCount = bareCount;
  if (bareCount >= 1) await bareInputs.nth(0).fill('en');

  out.boxes = await target.evaluate(() => [...document.querySelectorAll('.dropdownElementContainer__jbQOkl button')].map((b) => b.textContent.trim()));

  const pasteButtons = target.locator('button.pasteButton__cJqVky');
  const pasteCount = await pasteButtons.count();
  if (pasteCount > 0) {
    const targetBtn = pasteCount > 1 ? pasteButtons.nth(1) : pasteButtons.first();
    const fcPromise = target.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    await targetBtn.click();
    const fc = await fcPromise;
    if (fc) { await fc.setFiles([shot]); out.screenshot = 'uploaded'; }
    else {
      const fi = target.locator('input[type=file]');
      if (await fi.count() > 0) { await fi.setFiles([shot]); out.screenshot = 'uploaded-input'; }
      else out.screenshot = 'FAILED';
    }
  }
  await target.waitForTimeout(4000);

  // locate and click Create
  out.buttonCandidates = await target.evaluate(() => {
    return [...document.querySelectorAll('button')].map((b) => ({
      txt: b.textContent.trim().slice(0, 40), type: b.getAttribute('type') || '', cls: String(b.className || '').slice(0, 30)
    })).filter((b) => /create|submit/i.test(b.txt));
  });

  const createBtn = target.getByRole('button', { name: 'Create', exact: true }).last();
  let clicked = false;
  try {
    await createBtn.waitFor({ state: 'visible', timeout: 20000 });
    await createBtn.click();
    clicked = true;
  } catch (e) {
    out.clickError = String(e && e.message ? e.message : e).slice(0, 200);
  }
  out.clicked = clicked;
  await target.waitForTimeout(8000);
  out.urlAfter = target.url();
  out.titleAfter = await target.title().catch(() => null);
  return out;
}
