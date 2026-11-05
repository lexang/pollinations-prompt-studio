async (page) => {
  return await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const t = q('input[aria-label="Add a title"]');
    const a = q('textarea[placeholder^="Creates collaborative"]');
    const u = q('input[placeholder^="https://example.com"]');
    const g = q('input[placeholder^="https://github.com/username/repository"]');
    const labels = [...document.querySelectorAll('label')].map((l) => l.textContent.trim().slice(0, 20));
    const preview = Array.from(document.querySelectorAll('img'))
      .filter((i) => i.naturalWidth > 0)
      .map((i) => ({ src: i.src.slice(0, 60), r: Math.round(i.getBoundingClientRect().width), nat: i.naturalWidth }))
      .slice(0, 8);
    const boxes = [...document.querySelectorAll('.dropdownElementContainer__jbQOkl button')].map((b) => b.textContent.trim());
    return {
      title: t && t.value,
      descLen: a ? a.value.length : 0,
      desc: a && a.value.slice(0, 60),
      url: u && u.value,
      repo: g && g.value,
      labels,
      preview,
      boxes,
      fileInputs: document.querySelectorAll('input[type=file]').length,
      modal: /file chooser/i.test(document.body.innerText) ? 'maybe' : 'none'
    };
  });
}
