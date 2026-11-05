async (page) => {
  const out = {};
  const shot = 'D:\\workspace\\Cue\\pollinations-prompt-studio\\screenshots\\app.png';
  const pages = page.context().pages();
  const form = pages.find((p) => /app-submission.yml/.test(p.url()));
  if (!form) return { error: 'form not found' };

  out.before = await form.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const t = q('input[aria-label="Add a title"]');
    const lbl = Array.from(document.querySelectorAll('label')).find((x) => /Screenshot/.test(x.textContent));
    let root = lbl; for (let i = 0; i < 16 && root; i++) { root = root.parentElement; if (root && root.querySelector('img')) break; }
    return { title: t && t.value, imgsInRoot: root ? root.querySelectorAll('img').length : -1, imgs: Array.from(document.querySelectorAll('img')).filter((i) => i.naturalWidth > 100).map((i) => i.src.slice(0, 60)).slice(0, 6) };
  });

  const btns = form.locator('button.pasteButton__cJqVky');
  out.pasteCount = await btns.count();
  const btn = btns.first();
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  const fcPromise = form.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
  await btn.click({ timeout: 15000 }).catch((e) => { out.clickErr = String(e).slice(0, 120); });
  const fc = await fcPromise;
  if (fc) {
    try { await fc.setFiles([shot]); out.filesSet = true; }
    catch (e) { out.errorsSet = String(e).slice(0, 150); }
  } else {
    out.errorsSet = 'no filechooser event';
  }

  await form.waitForTimeout(12000);
  out.after = await form.evaluate(() => {
    const dangers = [...document.querySelectorAll('[class*="danger"],[role="alert"],[class*="Error"]')].map((e) => (e.textContent || '').trim().slice(0, 80)).filter(Boolean);
    const all = [...document.querySelectorAll('img')].filter((i) => i.naturalWidth > 100 && /user-images|github|objects|pollinations/.test(i.src)).map((i) => ({ s: i.src.slice(0, 70), n: i.naturalWidth, w: Math.round(i.getBoundingClientRect().width) }));
    return { dangers: dangers.slice(0, 5), preview: all.slice(0, 6), bodyHits: (document.body.innerText.match(/Failed to upload[^.]{0,40}/i) || []).slice(0, 3) };
  });

  return out;
}
