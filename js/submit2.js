async (page) => {
  const out = {};
  const pages = page.context().pages();
  const form = pages.find((p) => /app-submission.yml/.test(p.url()));
  if (!form) return { error: 'form not found' };

  out.state = await form.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const dangers = [...document.querySelectorAll('[class*="danger"],[role="alert"]')].map((e) => (e.textContent || '').trim().slice(0, 80)).filter(Boolean);
    const preview = [...document.querySelectorAll('img')].filter((i) => /user-images\.githubusercontent\.com/.test(i.src)).map((i) => ({ s: i.src.slice(0, 70), n: i.naturalWidth, w: Math.round(i.getBoundingClientRect().width) }));
    return {
      title: q('input[aria-label="Add a title"]') && q('input[aria-label="Add a title"]').value,
      appName: q('input[placeholder^="Sunflower Studio"]') && q('input[placeholder^="Sunflower Studio"]').value,
      descLen: q('textarea[placeholder^="Creates collaborative"]') ? q('textarea[placeholder^="Creates collaborative"]').value.length : 0,
      appUrl: q('input[placeholder^="https://example.com"]') && q('input[placeholder^="https://example.com"]').value,
      repoUrl: q('input[placeholder^="https://github.com/username/repository"]') && q('input[placeholder^="https://github.com/username/repository"]').value,
      dangers: dangers.slice(0, 6),
      preview,
      hit: (document.body.innerText.match(/Failed to upload[^.]{0,40}/i) || []).slice(0, 2)
    };
  });

  // click Create (button text has keyboard hint)
  const btn = form.locator('button').filter({ hasText: 'Create' }).last();
  out.btnCount = await form.locator('button').filter({ hasText: 'Create' }).count();
  await btn.click();
  await form.waitForTimeout(10000);
  out.urlAfter = form.url();
  out.titleAfter = await form.title().catch(() => null);
  out.issue = await form.evaluate(() => {
    const h1 = document.querySelector('h1');
    const meta = document.querySelector('.gh-header-meta');
    const b = document.querySelector('.js-comment-body, .markdown-body');
    return { h1: h1 && h1.textContent.trim(), meta: meta && meta.textContent.trim(), preview: b && b.querySelectorAll('img').length };
  }).catch(() => null);
  return out;
}
