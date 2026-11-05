async (page) => {
  const pages = page.context().pages();
  const form = pages.find((p) => /app-submission.yml/.test(p.url()));
  if (!form) return { error: 'form not found' };
  return await form.evaluate(() => {
    const files = [...document.querySelectorAll('input[type=file]')].map((f) => ({
      accept: f.accept, vis: f.offsetParent !== null || f.getClientRects().length > 0, name: f.name || ''
    }));
    const paste = [...document.querySelectorAll('button.pasteButton__cJqVky')].length;
    const labels = [...document.querySelectorAll('label')].map((l) => l.textContent.trim()).slice(0, 12);
    const scr = Array.from(document.querySelectorAll('label')).find((l) => /Screenshot/.test(l.textContent));
    let root = scr;
    let dom = null;
    for (let i = 0; i < 14 && root; i++) {
      root = root.parentElement;
      if (root && root.querySelector('.dropzone')) break;
    }
    if (root) {
      const dz = root.querySelector('.dropzone');
      if (dz) dom = dz.outerHTML.slice(0, 1500);
    }
    return { files, paste, labels, scrDom: dom };
  });
}
