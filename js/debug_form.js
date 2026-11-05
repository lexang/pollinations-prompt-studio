async (page) => {
  const out = {};
  const pages = page.context().pages();
  const form = pages.find((p) => /app-submission.yml/.test(p.url()));
  if (!form) return { error: 'form not found' };

  await form.waitForTimeout(2000);

  out.state = await form.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const dangers = [...document.querySelectorAll('[class*="danger"],[class*="onError"],[class*="Error"],[role="alert"]')].map((e) => (e.textContent || '').trim().slice(0, 80)).filter(Boolean);
    const createBtn = [...document.querySelectorAll('button')].find((b) => /Create/.test(b.textContent) && b.getAttribute('type') === 'button');
    return {
      title: q('input[aria-label="Add a title"]') && q('input[aria-label="Add a title"]').value,
      fileInputs: document.querySelectorAll('input[type=file]').length,
      createDisabled: createBtn ? createBtn.disabled : 'nobtn',
      fileName: [...document.querySelectorAll('input[type=file]')].map((f) => f.files && f.files.length ? f.files[0].name : 'none'),
      dangers: dangers.slice(0, 6),
      textHits: (document.body.innerText.match(/(?:required|error|cannot|too big|not supported|please add|missing)[^.]{0,50}/gi) || []).slice(0, 8),
      previewImgs: Array.from(document.querySelectorAll('img')).filter((i) => /user-images|github.com/.test(i.src) && i.naturalWidth > 100).map((i) => ({ s: i.src.slice(0, 60), w: i.naturalWidth }))
    };
  });

  // try keyboard submit: ctrl+enter
  out.beforeUrl = form.url();
  await form.keyboard.press('Control+Enter').catch(() => {});
  await form.waitForTimeout(6000);
  out.afterKeyboardUrl = form.url();
  out.afterTitle = await form.title().catch(() => null);

  return out;
}
