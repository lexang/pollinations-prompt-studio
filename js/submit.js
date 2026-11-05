async (page) => {
  const out = {};
  const pages = page.context().pages();
  const form = pages.find((p) => /app-submission.yml/.test(p.url()));
  if (!form) return { error: 'form page not found' };
  out.before = form.url();

  // find the Create button among those containing the text "Create"
  const btns = form.locator('button').filter({ hasText: 'Create' });
  out.count = await btns.count();

  const btn = btns.last();
  await btn.waitFor({ state: 'visible', timeout: 20000 });
  await btn.click();
  out.clicked = true;

  await form.waitForFunction(() => /issues\/\d+/.test(location.pathname), null, { timeout: 60000 }).catch(() => {});
  out.urlAfter = form.url();
  out.titleAfter = await form.title().catch(() => null);

  // read the created issue title/body if it was created
  out.issue = await form.evaluate(() => {
    const h1 = document.querySelector('h1');
    const meta = document.querySelector('.gh-header-meta span');
    return { h1: h1 && h1.textContent.trim(), meta: meta && meta.textContent.trim() };
  }).catch((e) => ({ err: String(e).slice(0, 120) }));

  return out;
}
