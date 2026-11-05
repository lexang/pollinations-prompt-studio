async (page) => {
  return await page.evaluate(() => {
    const out = {};
    out.controls = [...document.querySelectorAll('[id^="_R_"]')].map((e) => ({
      id: e.id, tag: e.tagName, role: e.getAttribute('role') || '',
      cls: String(e.className || '').slice(0, 40),
      vis: e.offsetParent !== null || e.getClientRects().length > 0
    }));
    out.comboboxes = [...document.querySelectorAll('[role=combobox],[role=listbox],[role=menu]')].map((e) => ({
      tag: e.tagName, role: e.getAttribute('role') || '', cls: String(e.className || '').slice(0, 40), text: (e.textContent || '').trim().slice(0, 40)
    }));
    const lbl = (t) => [...document.querySelectorAll('label')].find((l) => l.textContent.includes(t));
    const cat = lbl('App Category');
    out.catSnippet = cat ? cat.parentElement.parentElement.outerHTML.slice(0, 2600) : null;
    const scr = lbl('Screenshot');
    out.scrSnippet = scr ? scr.parentElement.parentElement.outerHTML.slice(0, 2200) : null;
    return out;
  });
}
