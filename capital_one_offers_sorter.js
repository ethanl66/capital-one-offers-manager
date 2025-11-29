(function() {
  /* --- BOOKMARKLET SCRIPT (v16 - Starred Merchants) --- */

  /* Prevent running multiple times */
  if (document.getElementById('c1-scraper-widget')) {
    alert('The scraper widget is already open!');
    return;
  }

  /* --- Storage Key for Starred Merchants --- */
  const STORAGE_KEY = 'c1ScraperStarredMerchants';
  const OFFERS_STORAGE_KEY = 'c1ScraperSavedOffers';

  /* --- Storage Helper Functions --- */
  
  /**
   * Gets the set of starred merchants from localStorage.
   * @returns {Set<string>} A Set of merchant names.
   */
  function getStarredMerchants() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return new Set();
      }
      return new Set(JSON.parse(stored));
    } catch (e) {
      console.error('Error reading starred merchants:', e);
      return new Set();
    }
  }

  /**
   * Saves the set of starred merchants to localStorage.
   * @param {Set<string>} starredSet - The Set of merchant names.
   */
  function saveStarredMerchants(starredSet) {
    try {
      const array = Array.from(starredSet);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (e) {
      console.error('Error saving starred merchants:', e);
    }
  }

  /**
   * Adds a merchant to the starred list.
   * @param {string} merchantName - The name of the merchant.
   */
  function addStarredMerchant(merchantName) {
    const starred = getStarredMerchants();
    starred.add(merchantName);
    saveStarredMerchants(starred);
  }

  /**
   * Removes a merchant from the starred list.
   * @param {string} merchantName - The name of the merchant.
   */
  function removeStarredMerchant(merchantName) {
    const starred = getStarredMerchants();
    starred.delete(merchantName);
    saveStarredMerchants(starred);
  }

  /* --- Saved Offers Storage Helpers --- */
  function getSavedOffers() {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY);
      if (!stored) return new Map();
      const arr = JSON.parse(stored);
      const m = new Map();
      for (const o of arr) {
        if (!o || !o.key) continue;
        m.set(o.key, o);
      }
      console.log(`Loaded ${m.size} saved offers from ${OFFERS_STORAGE_KEY}`);
      return m;
    } catch (e) {
      console.error('Error reading saved offers:', e);
      return new Map();
    }
  }

  function saveSavedOffers(offers) {
    try {
      // Merge incoming offers with existing saved offers instead of overwriting everything.
      // Behavior:
      // - If an incoming offer matches an existing one and any key fields changed, update savedAt to now.
      // - If an existing saved offer is NOT present in the incoming list, keep it but set its amount to 0.
      const existing = getSavedOffers(); // Map keyed by key
      const seen = new Set();

      for (const o of offers) {
        const key = [o.merchant, o.label, o.link].join('|');
        seen.add(key);
        const prev = existing.get(key);

        // Detect whether the incoming offer is meaningfully different from the saved one
        const changed = !prev || prev.type !== o.type || prev.merchant !== o.merchant || prev.label !== o.label || prev.link !== o.link || Number(prev.amount) !== Number(o.amount) || ((prev.channel || '') !== (o.channel || ''));

        const savedAt = (prev && !changed && prev.savedAt) ? prev.savedAt : Date.now();

        existing.set(key, {
          key,
          type: o.type,
          merchant: o.merchant,
          amount: o.amount,
          label: o.label,
          link: o.link,
          channel: o.channel || '',
          savedAt
        });
      }

      // Any previously-saved offers that were NOT present in the incoming list should have amount=0
      for (const [k, v] of existing.entries()) {
        if (!seen.has(k)) {
          existing.set(k, Object.assign({}, v, { amount: 0 }));
        }
      }

      const arr = [...existing.values()];
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(arr));
      console.log(`Merged and saved ${arr.length} offers to ${OFFERS_STORAGE_KEY}`);
    } catch (e) {
      console.error('Error saving offers:', e);
    }
  }


  /* --- Create Widget --- */
  const widget = document.createElement('div');
  widget.id = 'c1-scraper-widget';
  widget.style.position = 'fixed';
  widget.style.bottom = '20px';
  widget.style.right = '20px';
  widget.style.width = '300px';
  widget.style.maxHeight = '70vh';
  widget.style.backgroundColor = 'white';
  widget.style.border = '1px solid #ccc';
  widget.style.borderRadius = '8px';
  widget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  widget.style.zIndex = '9999';
  widget.style.fontFamily = 'Arial, sans-serif';
  widget.style.display = 'flex';
  widget.style.flexDirection = 'column';
  widget.style.transition = 'width 0.3s ease, height 0.3s ease';

  /* Header */
  const header = document.createElement('div');
  header.style.padding = '10px 16px';
  header.style.backgroundColor = '#f4f4f4';
  header.style.borderBottom = '1px solid #eee';
  header.style.borderTopLeftRadius = '8px';
  header.style.borderTopRightRadius = '8px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const title = document.createElement('div');
  title.textContent = 'C1 Offer Scraper';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '16px';
  title.style.color = '#004a9b';

  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = '—';
  minimizeButton.style.background = 'none';
  minimizeButton.style.border = 'none';
  minimizeButton.style.fontSize = '20px';
  minimizeButton.style.cursor = 'pointer';
  minimizeButton.style.color = '#aaa';
  minimizeButton.style.lineHeight = '1';
  minimizeButton.style.marginRight = '5px';
  minimizeButton.style.padding = '0 5px';
  minimizeButton.onmouseover = () => minimizeButton.style.color = '#333';
  minimizeButton.onmouseout = () => minimizeButton.style.color = '#aaa';
  minimizeButton.onclick = () => {
    const isMinimized = body.style.display === 'none';
    if (isMinimized) {
      body.style.display = 'flex';
      minimizeButton.textContent = '—';
      header.style.borderBottom = '1px solid #eee';
      widget.style.width = widget.getAttribute('data-last-width') || '300px';
    } else {
      widget.setAttribute('data-last-width', widget.style.width);
      body.style.display = 'none';
      minimizeButton.textContent = '❐';
      header.style.borderBottom = 'none';
      widget.style.width = '220px';
    }
  };

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#aaa';
  closeButton.style.lineHeight = '1';
  closeButton.style.padding = '0 5px';
  closeButton.onmouseover = () => closeButton.style.color = '#333';
  closeButton.onmouseout = () => closeButton.style.color = '#aaa';
  closeButton.onclick = () => document.body.removeChild(widget);

  const headerButtonGroup = document.createElement('div');
  headerButtonGroup.style.display = 'flex';
  headerButtonGroup.style.alignItems = 'center';
  headerButtonGroup.appendChild(minimizeButton);
  headerButtonGroup.appendChild(closeButton);

  header.appendChild(title);
  header.appendChild(headerButtonGroup);

  /* Body */
  const body = document.createElement('div');
  body.style.padding = '16px';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.overflowY = 'auto';
  body.style.overflowX = 'hidden';

  /* Status Area */
  const statusEl = document.createElement('div');
  statusEl.textContent = "Click 'Load All Offers' to automatically load every offer; then click 'Show Loaded Offers'.";
  statusEl.style.color = '#333';
  statusEl.style.backgroundColor = '#f4f4f4';
  statusEl.style.padding = '8px';
  statusEl.style.borderRadius = '4px';
  statusEl.style.marginBottom = '12px';
  statusEl.style.fontSize = '13px';
  statusEl.style.lineHeight = '1.4';

  /* 1. Scroll Button */
  const scrollToButton = document.createElement('button');
  scrollToButton.textContent = 'Load All Offers';
  scrollToButton.style.width = '100%';
  scrollToButton.style.padding = '10px';
  scrollToButton.style.backgroundColor = '#0076c0';
  scrollToButton.style.color = 'white';
  scrollToButton.style.border = 'none';
  scrollToButton.style.fontSize = '14px';
  scrollToButton.style.borderRadius = '4px';
  scrollToButton.style.cursor = 'pointer';
  scrollToButton.style.marginBottom = '8px';
  scrollToButton.onmouseover = () => scrollToButton.style.backgroundColor = '#005a9b';
  scrollToButton.onmouseout = () => scrollToButton.style.backgroundColor = '#0076c0';
  scrollToButton.onclick = async () => {
    // Automatically scroll and click the "View More Offers" control until none remain
    try {
      scrollToButton.disabled = true;
      const origText = scrollToButton.textContent;
      scrollToButton.textContent = 'Auto-loading...';
      await autoLoadAllOffers(statusEl);
      scrollToButton.textContent = origText;
    } catch (err) {
      console.error('Auto load failed:', err);
      statusEl.textContent = `Auto-load error: ${err.message}`;
      statusEl.style.backgroundColor = '#ffebee';
    } finally {
      scrollToButton.disabled = false;
    }
  };

  /* 2. Parse Button */
  const parseButton = document.createElement('button');
  parseButton.textContent = 'Show Loaded Offers';
  parseButton.style.width = '100%';
  parseButton.style.padding = '10px';
  parseButton.style.backgroundColor = '#25810e';
  parseButton.style.color = 'white';
  parseButton.style.border = 'none';
  parseButton.style.fontSize = '14px';
  parseButton.style.borderRadius = '4px';
  parseButton.style.cursor = 'pointer';

  /* --- NEW (v16): Starred Filter --- */
  const filterWrapper = document.createElement('div');
  filterWrapper.style.display = 'none'; /* Hide until parse */
  filterWrapper.style.width = '100%';
  filterWrapper.style.marginTop = '12px';
  filterWrapper.style.padding = '8px';
  filterWrapper.style.backgroundColor = '#f9f9f9';
  filterWrapper.style.border = '1px solid #eee';
  filterWrapper.style.borderRadius = '4px';
  filterWrapper.style.boxSizing = 'border-box';
  
  const starredFilterLabel = document.createElement('label');
  starredFilterLabel.style.display = 'flex';
  starredFilterLabel.style.alignItems = 'center';
  starredFilterLabel.style.cursor = 'pointer';
  starredFilterLabel.style.fontSize = '14px';
  
  const starredFilterCheckbox = document.createElement('input');
  starredFilterCheckbox.type = 'checkbox';
  starredFilterCheckbox.id = 'c1-star-filter';
  starredFilterCheckbox.style.marginRight = '8px';
  starredFilterCheckbox.style.cursor = 'pointer';
  
  starredFilterLabel.appendChild(starredFilterCheckbox);
  starredFilterLabel.appendChild(document.createTextNode('Show starred merchants only'));
  filterWrapper.appendChild(starredFilterLabel);
  
  /* --- NEW: Increased Filter Checkbox --- */
  const increasedFilterLabel = document.createElement('label');
  increasedFilterLabel.style.display = 'flex';
  increasedFilterLabel.style.alignItems = 'center';
  increasedFilterLabel.style.cursor = 'pointer';
  increasedFilterLabel.style.fontSize = '14px';
  increasedFilterLabel.style.marginTop = '6px';

  const increasedFilterCheckbox = document.createElement('input');
  increasedFilterCheckbox.type = 'checkbox';
  increasedFilterCheckbox.id = 'c1-increased-filter';
  increasedFilterCheckbox.style.marginRight = '8px';
  increasedFilterCheckbox.style.cursor = 'pointer';

  increasedFilterLabel.appendChild(increasedFilterCheckbox);
  increasedFilterLabel.appendChild(document.createTextNode('Show increased offers only'));
  filterWrapper.appendChild(increasedFilterLabel);
  /* --- END Increased Filter --- */
  /* --- END NEW (v16) --- */

  /* --- NEW: Section Jump Navigation (hidden until parse) --- */
  const navWrapper = document.createElement('div');
  navWrapper.id = 'c1-nav-wrapper';
  navWrapper.style.display = 'none';
  navWrapper.style.width = '100%';
  navWrapper.style.marginTop = '10px';
  navWrapper.style.display = 'none';
  navWrapper.style.justifyContent = 'space-between';
  navWrapper.style.alignItems = 'center';
  navWrapper.style.gap = '6px';

  const makeJumpButton = (text, targetId) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.flex = '1';
    btn.style.padding = '6px 8px';
    btn.style.fontSize = '12px';
    btn.style.borderRadius = '4px';
    btn.style.border = '1px solid #ddd';
    btn.style.background = '#fff';
    btn.style.cursor = 'pointer';
    btn.onmouseover = () => btn.style.background = '#f4f8ff';
    btn.onmouseout = () => btn.style.background = '#fff';
    btn.onclick = (e) => {
      e.stopPropagation();
      const target = document.getElementById(targetId);
      if (target) {
        try {
          target.scrollIntoView({ block: 'center' });
          highlightElementFade(target, 800);
        } catch (err) {
          console.warn('Jump failed', err);
        }
      }
    };
    return btn;
  };

  const jumpPercentBtn = makeJumpButton('PERCENT', 'c1-percent-header');
  const jumpMultiplierBtn = makeJumpButton('X MILES', 'c1-multiplier-header');
  const jumpFlatBtn = makeJumpButton('FLAT OFFERS', 'c1-flat-header');

  navWrapper.appendChild(jumpPercentBtn);
  navWrapper.appendChild(jumpMultiplierBtn);
  navWrapper.appendChild(jumpFlatBtn);

  /* --- END NAV --- */

  /* --- NEW: Highlight CSS + helper --- */
  (function injectHighlightStyle(){
    if (document.getElementById('c1-jump-highlight-style')) return;
    const style = document.createElement('style');
    style.id = 'c1-jump-highlight-style';
    style.textContent = `
      .c1-jump-highlight {
        box-shadow: 0 0 8px 3px rgba(0,118,192,0.7) !important;
        transition: box-shadow 350ms ease, outline 350ms ease, background-color 350ms ease !important;
        border-radius: 6px !important;
      }
    `;
    document.head.appendChild(style);
  })();

  function highlightElementFade(el, ms = 1000) {
    if (!el) return;
    try {
      el.classList.add('c1-jump-highlight');
      setTimeout(() => {
        el.classList.remove('c1-jump-highlight');
      }, ms);
    } catch (e) {
      try {
        const prev = el.style.boxShadow;
        el.style.boxShadow = '0 0 8px 3px rgba(0,118,192,0.7)';
        setTimeout(() => { el.style.boxShadow = prev || ''; }, ms);
      } catch (err) { /* ignore */ }
    }
  }


  /* Search Input */
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search results...';
  searchInput.style.width = 'calc(100% - 18px)';
  searchInput.style.padding = '8px';
  searchInput.style.border = '1px solid #ccc';
  searchInput.style.borderRadius = '4px';
  searchInput.style.marginTop = '8px';
  searchInput.style.display = 'none';
  searchInput.style.fontSize = '13px';
  
  /* Add listeners to trigger filter */
  searchInput.oninput = () => filterResults();
  starredFilterCheckbox.onchange = () => filterResults();
  increasedFilterCheckbox.onchange = () => filterResults();

  /* Results Area */
  const resultsEl = document.createElement('div');
  resultsEl.id = 'c1-scraper-results';
  resultsEl.style.display = 'none';
  resultsEl.style.width = '100%';
  resultsEl.style.borderTop = '1px solid #eee';
  resultsEl.style.marginTop = '16px';
  resultsEl.style.paddingTop = '16px';
  resultsEl.style.fontSize = '13px';
  resultsEl.style.lineHeight = '1.6';
  resultsEl.style.color = '#333';

  /* 3. Reset Button */
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.style.width = '100%';
  resetButton.style.padding = '8px';
  resetButton.style.backgroundColor = '#888';
  resetButton.style.color = 'white';
  resetButton.style.border = 'none';
  resetButton.style.fontSize = '14px';
  resetButton.style.borderRadius = '4px';
  resetButton.style.cursor = 'pointer';
  resetButton.style.marginTop = '12px';
  resetButton.style.display = 'none';
  resetButton.onmouseover = () => resetButton.style.backgroundColor = '#666';
  resetButton.onmouseout = () => resetButton.style.backgroundColor = '#888';

  /* --- Assemble Widget --- */
  body.appendChild(statusEl);
  body.appendChild(scrollToButton);
  body.appendChild(parseButton);
  body.appendChild(resetButton);
  body.appendChild(filterWrapper); /* NEW (v16) */
  body.appendChild(navWrapper); /* NEW: Section jump nav */
  body.appendChild(searchInput);
  body.appendChild(resultsEl);
  widget.appendChild(header);
  widget.appendChild(body);
  document.body.appendChild(widget);

  /* --- Main Click Handlers --- */

  parseButton.onclick = async () => {
    try {
      parseButton.disabled = true;
      scrollToButton.disabled = true;
      parseButton.style.backgroundColor = '#aaa';
      scrollToButton.style.backgroundColor = '#aaa';
      parseButton.textContent = 'Working...';
      statusEl.textContent = 'Parsing all loaded offers...';
      statusEl.style.backgroundColor = '#f4f4f4';

      await runParseOnly(statusEl, resultsEl);

      resultsEl.style.display = 'block';
      searchInput.style.display = 'block';
      filterWrapper.style.display = 'block'; /* NEW (v16) */
      navWrapper.style.display = 'flex'; /* NEW: show section jump nav */
      scrollToButton.style.display = 'none';
      parseButton.style.display = 'none';
      resetButton.style.display = 'block';

      widget.style.width = '600px';
      widget.style.right = '20px';
      widget.setAttribute('data-last-width', '600px');

    } catch (error) {
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.style.backgroundColor = '#ffebee';
      console.error('Scraper error:', error);
      parseButton.disabled = false;
      scrollToButton.disabled = false;
      parseButton.style.backgroundColor = '#25810e';
      scrollToButton.style.backgroundColor = '#0076c0';
      parseButton.textContent = 'View All Loaded Offers';
    }
  };

  resetButton.onclick = () => {
    resultsEl.style.display = 'none';
    resultsEl.innerHTML = '';
    resetButton.style.display = 'none';
    searchInput.style.display = 'none';
    searchInput.value = '';
    filterWrapper.style.display = 'none'; /* NEW (v16) */
    starredFilterCheckbox.checked = false; /* NEW (v16) */
    navWrapper.style.display = 'none'; /* NEW: hide section jump nav on reset */

    scrollToButton.style.display = 'block';
    parseButton.style.display = 'block';
    parseButton.disabled = false;
    scrollToButton.disabled = false;
    parseButton.textContent = 'View All Loaded Offers';
    parseButton.style.backgroundColor = '#25810e';
    scrollToButton.style.backgroundColor = '#0076c0';

    widget.style.width = '300px';
    widget.setAttribute('data-last-width', '300px');

    statusEl.textContent = "Click 'Find & Scroll' to jump to the 'View More' button. Click it manually.";
    statusEl.style.backgroundColor = '#f4f4f4';
  };


  /* --- Core Functions --- */

  let highlightedTile = null;

  /**
   * Finds the "View More Offers" button, scrolls to it, and highlights it.
   * @param {HTMLElement} statusEl - The element to update with status messages.
   */
  function findAndScroll(statusEl) {
    if (highlightedTile) {
      highlightedTile.style.outline = 'none';
      highlightedTile.style.boxShadow = ''; /* Reset box shadow */
      highlightedTile.style.borderRadius = '';
    }

    const viewMoreButton = findViewMoreButton();
    if (viewMoreButton) {
      viewMoreButton.scrollIntoView({ block: 'center' });
      viewMoreButton.style.outline = '3px solid red';
      viewMoreButton.style.boxShadow = '0 0 8px 2px rgba(255,0,0,0.65)';
      viewMoreButton.style.borderRadius = '4px';
      highlightedTile = viewMoreButton;
      statusEl.textContent = "Found it! Click the flashing red button.";
      statusEl.style.backgroundColor = '#fff9c4';
    } else {
      statusEl.textContent = "All offers are loaded. You can view loaded offers now.";
      statusEl.style.backgroundColor = '#c8e6c9';
    }
  }

  /**
   * Helper function to find the "View More Offers" button.
   * @returns {HTMLElement | null} The button element or null.
   */
  function findViewMoreButton() {
    const xpath = "//button[contains(., 'View More Offers')]";
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }

  /**
   * Auto-scroll to bottom and click "View More Offers" repeatedly until it's gone.
   * This mirrors the behavior in `jaypatelversion` for automated loading.
   * @param {HTMLElement} statusEl
   */
  async function autoLoadAllOffers(statusEl) {
    const BUTTON_TEXT = 'View More Offers';
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    console.log('autoLoadAllOffers: started');
    let clickCount = 0;

    statusEl.textContent = 'Auto-loading offers...';
    statusEl.style.backgroundColor = '#f4f4f4';

    // helper to search for internal framework handlers (React/Vue)
    function searchForHandler(obj) {
      if (typeof obj === 'object' && obj !== null) {
        for (const prop in obj) {
          try {
            if (typeof obj[prop] === 'function' && (prop.toLowerCase().includes('click') || prop.toLowerCase().includes('load'))) {
              return obj[prop];
            }
            if (prop.includes('Props') || prop.includes('Children') || prop.includes('Memo')) {
              const res = searchForHandler(obj[prop]);
              if (res) return res;
            }
          } catch (e) {
            // ignore access errors
          }
        }
      }
      return null;
    }

    // initial attempts to find the button (give the page some time to render)
    let targetButton = null;
    for (let i = 0; i < 10; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(250);
      targetButton = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && el.textContent.trim() === BUTTON_TEXT);
      if (targetButton) break;
    }

    // Loop while the button exists; click and wait for new content
    while (targetButton) {
      try {
        window.scrollTo(0, document.body.scrollHeight);
        //statusEl.textContent = `Clicking '${BUTTON_TEXT}'...`;
        statusEl.textContent = 'Loading offers...';
        targetButton.scrollIntoView({ block: 'center' });
        await sleep(300);

        // normal click
        try { targetButton.click(); } catch (e) { /* ignore */ }
        clickCount++;
        console.log(`autoLoadAllOffers: clicked '${BUTTON_TEXT}' (${clickCount})`);

        // defensive: try to invoke framework handlers directly if available
        for (const key in targetButton) {
          if (key.startsWith('__react') || key.startsWith('__vue')) {
            const internal = targetButton[key];
            const handler = searchForHandler(internal);
            if (typeof handler === 'function') {
              try { handler({}); } catch (e) { /* ignore */ }
            }
            break;
          }
        }

        // wait a bit for content to load
        await sleep(600);

        // re-scan for next button
        targetButton = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && el.textContent.trim() === BUTTON_TEXT);
      } catch (err) {
        console.error('autoLoadAllOffers loop error:', err);
        break;
      }
    }

    statusEl.textContent = 'Auto-load complete. You can view loaded offers now.';
    statusEl.style.backgroundColor = '#c8e6c9';
    console.log(`autoLoadAllOffers: complete after ${clickCount} clicks`);
  }

  /**
   * Runs the parsing and display logic.
   * @param {HTMLElement} statusEl - The element to update with status messages.
   * @param {HTMLElement} resultsEl - The element to display the final results.
   */
  async function runParseOnly(statusEl, resultsEl) {
    const allOffers = parseOffers();
    if (allOffers.length === 0) {
      throw new Error('No offers found on the page.');
    }

    statusEl.textContent = 'Comparing to previously saved offers...';
    const prevMap = getSavedOffers();
    /* expose prevMap for other UI operations if needed */
    window.c1_lastSavedOffersMap = prevMap;

    statusEl.textContent = 'Sorting and displaying results...';
    displayResults(allOffers, resultsEl, prevMap);

    /* Persist current results for next comparison */
    try {
      saveSavedOffers(allOffers);
      console.log(`Persisted ${allOffers.length} offers to ${OFFERS_STORAGE_KEY}`);
    } catch (e) {
      console.error('Failed to persist offers:', e);
    }

    statusEl.textContent = `Done! Found ${allOffers.length} offers. You can now search or reset.`;
  }


  /* --- NEW (v12) PARSING LOGIC FROM EXAMPLE SCRIPT --- */

  /**
   * Gets clean text content from a node.
   * @param {Node} n - The node.
   * @returns {string}
   */
  const T = n => n && n.textContent ? n.textContent.replace(/\s+/g, " ").trim() : "";

  /**
   * @param {string} s - Input string.
   * @returns {string} - Title-cased string.
   */
  function titleCase(s) {
    return s.split(/[_\s]+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "").join(" ")
  }

  /**
   * @param {string} s - Input string.
   * @returns {boolean} - True if name is generic/bad.
   */
  const badName = s => !s || s.length < 2 || /(search offers|capital one offers|exclusive coupon)/i.test(s);

  /**
   * @param {string} s - Input string.
   * @returns {string} - Cleaned string.
   */
  const clean = s => s.replace(/for you|exclusive coupon/gi, "").replace(/\s{2,}/g, " ").trim();

  /**
   * Tries to get a brand name from a URL or URL-like string.
   * @param {string} urlish - The URL string.
   * @returns {string} - A possible brand name.
   */
  function brandFromUrlish(urlish) {
    try {
      const u = new URL(urlish, location.href);
      const p = u.searchParams;
      let cand = p.get("domain") || p.get("merchant") || p.get("brand") || p.get("name") || p.get("merchant_domain") || p.get("merchantUrl") || p.get("merchant_url") || p.get("store") || p.get("merchantName");
      if (cand) {
        cand = cand.trim();
        if (/^https?:\/\//i.test(cand)) cand = new URL(cand).hostname;
        const host = cand.replace(/^www\./, "").replace(/\/.*$/, "");
        const base = host.includes(".") ? host.split(".")[0] : host;
        return titleCase(base.replace(/[-_]+/g, " "))
      }
      const host = u.hostname.replace(/^www\./, "");
      if (host && !/capitalone/i.test(host)) {
        return titleCase(host.split(".")[0].replace(/[-_]+/g, " "))
      }
    } catch (e) {
      /* console.warn('brandFromUrlish failed:', e); */
    }
    return ""
  }

  /**
   * Finds the best merchant name from a logo's URL.
   * @param {HTMLElement} scope - The tile element.
   * @returns {string} - The merchant name, or empty string.
   */
  function bestLogoName(scope) {
    const img = scope.querySelector('img[src*="/api/v1/logos"]') || scope.querySelector('img[src*="images.capitaloneshopping.com/api/v1/logos"]') || scope.querySelector('img[src*="capitaloneshopping.com/api/v1/logos"]') || scope.querySelector('img[src*="logos?"]');
    if (!img) return "";
    const fromSet = (img.getAttribute("srcset") || "").split(/\s+/).find(s => /api\/v1\/logos|logos\?/.test(s)) || "";
    const urlish = img.currentSrc || img.src || fromSet || "";
    let name = brandFromUrlish(urlish);
    if (name) return name;
    try {
      const u = new URL(urlish, location.href);
      const dom = u.searchParams.get("domain");
      if (dom) {
        const host = dom.replace(/^www\./, "");
        return titleCase(host.split(".")[0].replace(/[-_]+/g, " "))
      }
    } catch (e) {
      /* console.warn('bestLogoName fallback failed:', e); */
    }
    return ""
  }

  /**
   * Fallback logic to find a merchant name from other text.
   * @param {HTMLElement} tile - The tile element.
   * @param {string} text - The offer text.
   * @returns {string} - The merchant name.
   */
  function fallbackName(tile, text) {
    const img = tile.querySelector("img[alt]");
    if (img && img.alt && !/logo/i.test(img.alt)) {
      const a = clean(img.alt);
      if (!badName(a)) return a
    }
    const labeled = tile.matches("[aria-label]") ? tile : tile.querySelector("[aria-label]");
    if (labeled) {
      const a = clean(labeled.getAttribute("aria-label") || "");
      if (!badName(a)) return a
    }
    const sr = tile.querySelector(".sr-only, .visually-hidden, [class*=sr], [class*=visually]");
    if (sr) {
      const a = clean(T(sr));
      if (!badName(a)) return a
    }
    const cand = [...tile.querySelectorAll("h1,h2,h3,strong,b,span,div")].map(T).filter(s => s && !/miles|online|in-?store|back/i.test(s) && s.length <= 50).find(s => !badName(s));
    if (cand) return cand;

    const linkEl = tile.querySelector("a");
    const href = tile.tagName === "A" ? tile.href : (linkEl ? linkEl.href : "");
    if (href) {
      try {
        const u = new URL(href, location.href);
        const q = u.searchParams.get("merchant") || u.searchParams.get("brand") || u.searchParams.get("name");
        if (q && !badName(q)) return titleCase(clean(q));
        const host = u.hostname.replace(/^www\./, "");
        if (host && !/capitalone/i.test(host)) return titleCase(host.split(".")[0])
      } catch (e) {
        /* console.warn('fallbackName href parse failed:', e); */
      }
    }
    const guess = clean((text || "").split(/Online|In-Store|\bUp to\b|\bGet\b/i)[0]).split(/\s+/)[0] || "Unknown";
    if (!badName(guess)) return guess;
    return "Unknown"
  }

  /**
   * Gets the offer channel (e.g., "Online").
   * @param {string} t - The text of the tile.
   * @returns {string}
   */
  const channelOf = t => {
    const s = t.toLowerCase();
    if (/in-?store/.test(s) && /online/.test(s)) return "In-Store & Online";
    if (/in-?store/.test(s)) return "In-Store";
    if (/online/.test(s)) return "Online";
    return ""
  };

  /**
   * Checks for a "New" badge.
   * @param {HTMLElement} scope - The tile element.
   * @returns {boolean}
   */
  function hasNewBadge(scope) {
    const txt = n => (n && (n.innerText || n.textContent) || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!scope) return false;
    if (txt(scope).includes("new offer")) return true;
    const badge = scope.querySelector(["[aria-label*=new i]", "[data-badge*=new i]", "[class*=new]", "[class*=badge]", "[class*=pill]"].join(","));
    if (badge && /new/i.test(txt(badge))) return true;
    const sr = scope.querySelector(".sr-only, .visually-hidden, [class*=sr], [class*=visually]");
    if (sr && /new offer/i.test(txt(sr))) return true;
    return false
  }

  /**
   * Parses the offer text for percent, multiplier, or flat values.
   * @param {string} t - The text of the tile.
   * @param {HTMLElement} scope - The tile element.
   * @returns {object | null}
   */
  function parseMiles(t, scope) {
    const MULT_CUTOFF = 20,
      PCT_CUTOFF = 100;

    function scanScopeForMultiplier(root) {
      try {
        const iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
        const toks = [];
        let n;
        while ((n = iter.nextNode())) {
          const s = (n.textContent || "").trim();
          if (!s) continue;
          toks.push(...s.split(/(\d+(?:\.\d+)?|[xX×]|miles)/i).filter(Boolean).map(x => x.trim()).filter(Boolean))
        }
        const vals = [];
        for (let i = 0; i < toks.length; i++) {
          const cur = toks[i];
          if (/^\d+(?:\.\d+)?$/.test(cur)) {
            const nxt = toks[i + 1];
            if (nxt && /^[xX×]$/.test(nxt)) vals.push(parseFloat(cur))
          }
          if (/^miles$/i.test(cur)) {
            for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
              if (/^[xX×]$/.test(toks[j])) {
                const k = j - 1;
                if (k >= 0 && /^\d+(?:\.\d+)?$/.test(toks[k])) vals.push(parseFloat(toks[k]));
                break
              }
            }
          }
        }
        return vals
      } catch (e) {
        return []
      }
    }

    function scanScopeForPercentStrict(root) {
      try {
        const iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
        const toks = [];
        let n;
        while ((n = iter.nextNode())) {
          const s = (n.textContent || "").replace(/\s+/g, " ").trim();
          if (!s) continue;
          toks.push(...s.split(/(\d+(?:\.\d+)?)\s*(%|percent)|back|cash|cashback/i).filter(Boolean).map(x => x.trim()).filter(Boolean))
        }
        const nearBack = i => {
          for (let j = i; j < i + 5 && j < toks.length; j++) {
            if (/^back$/i.test(toks[j]) || /^cashback$/i.test(toks[j])) return true
          }
          return false
        };
        const vals = [];
        for (let i = 0; i < toks.length; i++) {
          const cur = toks[i];
          if (/^\d+(?:\.\d+)?$/.test(cur)) {
            const nxt = toks[i + 1];
            if (nxt && (/^%$/i.test(nxt) || /^percent$/i.test(nxt)) && nearBack(i + 1)) vals.push(parseFloat(cur))
          }
          if (/^%$/i.test(cur) && i > 0 && nearBack(i)) {
            const prev = toks[i - 1];
            if (/^\d+(?:\.\d+)?$/.test(prev)) vals.push(parseFloat(prev))
          }
        }
        return vals
      } catch (e) {
        return []
      }
    }
    const tn = (t || "").replace(/([A-Za-z])(\d)/g, "$1 $2").replace(/(\d)([A-Za-z])/g, "$1 $2");
    let pct = [];
    if (scope) pct.push(...scanScopeForPercentStrict(scope));
    if (!pct.length) {
      pct.push(...[...tn.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:cash\s*)?back/gi)].map(m => parseFloat(m[1])))
    }
    const pctWithin = pct.filter(v => v > 0 && v <= PCT_CUTOFF);
    if (pctWithin.length) {
      const v = Math.max(...pctWithin);
      return {
        type: "percent",
        value: v,
        label: `${v}% back`
      }
    }
    let mult = [];
    if (scope) mult.push(...scanScopeForMultiplier(scope));
    mult.push(...[...tn.matchAll(/(?:^|[^0-9A-Za-z])(\d+(?:\.\d+)?)\s*[xX×]\s*miles\b/gi)].map(m => parseFloat(m[1])));
    const multWithin = mult.filter(v => v > 0 && v <= MULT_CUTOFF);
    if (multWithin.length) {
      const v = Math.max(...multWithin);
      return {
        type: "multiplier",
        value: v,
        label: `${v}X miles`
      }
    }
    if (mult.length) {
      const v = Math.max(...mult);
      return {
        type: "multiplier",
        value: v,
        label: `${v}X miles`
      }
    }
    /* --- MODIFIED (v12): Added regex for flat dollar amounts --- */
    const flats = [...tn.matchAll(/([\d,]+)\s*miles|(?:\$([\d,]+))\s*back/gi)].map(m => {
      const miles = m[1];
      const dollars = m[2];
      if (miles) return {
        val: +miles.replace(/,/g, ""),
        unit: "miles"
      };
      if (dollars) return {
        val: +dollars.replace(/,/g, ""),
        unit: "dollars"
      };
      return null;
    }).filter(Boolean);

    if (flats.length) {
      const maxVal = Math.max(...flats.map(f => f.val));
      const maxOffer = flats.find(f => f.val === maxVal);
      if (maxOffer.unit === "miles") {
        return {
          type: "flat",
          value: maxVal,
          label: `${maxVal.toLocaleString()} miles` /* e.g., 500 miles */
        }
      }
      if (maxOffer.unit === "dollars") {
        return {
          type: "flat",
          value: maxVal,
          /* We can use 'value' for sorting, and a different field for currency */
          label: `$${maxVal.toLocaleString()} back` /* e.g., $150 back */
        }
      }
    }
    return null
  }


  /**
   * Re-written parseOffers function using the new logic.
   * @returns {Array<Object>} An array of offer objects.
   */
  function parseOffers() {
    /* Find all elements that contain an offer text */
    const candidates = [...document.querySelectorAll("*")].filter(el => /(miles|%|back)/i.test(T(el)));
    const picked = new Set();
    const map = new Map();
    console.log(`[v12] Found ${candidates.length} potential offer text nodes.`);

    for (const el of candidates) {
      const text = T(el);
      /* This is the new parser for %, X miles, and $ */
      const offerInfo = parseMiles(text, el);
      if (!offerInfo) continue;

      /* Walk up the DOM to find the parent "tile" */
      let tile = el;
      for (let i = 0; i < 6 && tile; i++) {
        const r = tile.getBoundingClientRect();
        /* Use heuristics to identify a "card" */
        const looksCard = r.width >= 110 && r.height >= 90 && r.width <= 560 && r.height <= 420;
        if (looksCard && /(miles|%|back)/i.test(T(tile))) break;
        tile = tile.parentElement
      }
      if (!tile) continue;

      /* Avoid processing the same tile multiple times */
      if (picked.has(tile)) continue;
      picked.add(tile);

      /* Use the new advanced name finders */
      let name = bestLogoName(tile) || fallbackName(tile, text);
      name = titleCase(clean(name));

      if (badName(name)) {
        console.warn('Skipping tile, bad name:', name, tile);
        continue;
      }

      const linkEl = tile.querySelector("a");
      const link = tile.tagName === "A" ? tile.href : (linkEl ? linkEl.href : "");
      const channel = channelOf(text);
      const isNew = hasNewBadge(tile);

      /* Use a map to de-duplicate identical offers */
      const key = [name, offerInfo.label, link].join("|");
      if (!map.has(key)) {
        map.set(key, {
          type: offerInfo.type,
          /* 'percent', 'multiplier', 'flat' */
          merchant: name,
          amount: offerInfo.value,
          label: offerInfo.label,
          /* '5% back', '10X miles', '$150 back' */
          channel: channel,
          link: link,
          tile: tile,
          isNew: isNew
        })
      }
    }
    const allOffers = [...map.values()];
    console.log(`[v12] Parsed ${allOffers.length} unique offers.`);
    return allOffers;
  }

  /* --- END (v12) PARSING LOGIC --- */


  /* --- MODIFIED (v16): Filter Results Function --- */
  /**
   * Filters the displayed result lists based on a search term and starred status.
   */
  function filterResults() {
    const lowerTerm = searchInput.value.toLowerCase();
    const starredOnly = starredFilterCheckbox.checked;
    const increasedOnly = increasedFilterCheckbox.checked;

    let percentVisible = 0;
    let multiplierVisible = 0;
    let flatVisible = 0;

    /* Filter Percent List */
    const percentList = document.getElementById('c1-percent-list');
    if (percentList) {
      percentList.querySelectorAll('.c1-scraper-result-line').forEach(line => {
        const merchantName = line.dataset.merchant.toLowerCase();
        const isStarred = line.dataset.starred === 'true';
        
        const matchesSearch = merchantName.includes(lowerTerm);
        const matchesStar = !starredOnly || (starredOnly && isStarred);
        const matchesIncreased = !increasedOnly || (increasedOnly && line.dataset.increased === 'true');

        if (matchesSearch && matchesStar && matchesIncreased) {
          line.style.display = 'flex';
          percentVisible++;
        } else {
          line.style.display = 'none';
        }
      });
    }

    /* Filter Multiplier List */
    const multiplierList = document.getElementById('c1-multiplier-list');
    if (multiplierList) {
      multiplierList.querySelectorAll('.c1-scraper-result-line').forEach(line => {
        const merchantName = line.dataset.merchant.toLowerCase();
        const isStarred = line.dataset.starred === 'true';
        
        const matchesSearch = merchantName.includes(lowerTerm);
        const matchesStar = !starredOnly || (starredOnly && isStarred);
        const matchesIncreased = !increasedOnly || (increasedOnly && line.dataset.increased === 'true');

        if (matchesSearch && matchesStar && matchesIncreased) {
          line.style.display = 'flex';
          multiplierVisible++;
        } else {
          line.style.display = 'none';
        }
      });
    }

    /* Filter Flat List */
    const flatList = document.getElementById('c1-flat-list');
    if (flatList) {
      flatList.querySelectorAll('.c1-scraper-result-line').forEach(line => {
        const merchantName = line.dataset.merchant.toLowerCase();
        const isStarred = line.dataset.starred === 'true';
        
        const matchesSearch = merchantName.includes(lowerTerm);
        const matchesStar = !starredOnly || (starredOnly && isStarred);
        const matchesIncreased = !increasedOnly || (increasedOnly && line.dataset.increased === 'true');

        if (matchesSearch && matchesStar && matchesIncreased) {
          line.style.display = 'flex';
          flatVisible++;
        } else {
          line.style.display = 'none';
        }
      });
    }

    /* Show/hide headers based on visible items */
    const percentHeader = document.getElementById('c1-percent-header');
    if (percentHeader) percentHeader.style.display = percentVisible > 0 ? 'block' : 'none';

    const multiplierHeader = document.getElementById('c1-multiplier-header');
    if (multiplierHeader) multiplierHeader.style.display = multiplierVisible > 0 ? 'block' : 'none';

    const flatHeader = document.getElementById('c1-flat-header');
    if (flatHeader) flatHeader.style.display = flatVisible > 0 ? 'block' : 'none';
  }
  /* --- END (v16) --- */

  /**
   * Sorts the offers and displays them in the results element.
   * @param {Array<Object>} allOffers - The array of offer objects.
   * @param {HTMLElement} resultsEl - The element to display the final results.
   */
  function displayResults(allOffers, resultsEl, prevMap = new Map()) {
    /* Clear previous results */
    resultsEl.innerHTML = '';
    
    /* NEW (v16): Get the set of starred merchants once */
    const starredSet = getStarredMerchants();

    /* --- NEW (v12): Create three lists based on type --- */
    const sortedByPercent = allOffers
      .filter(o => o.type === 'percent')
      .sort((a, b) => b.amount - a.amount);

    const sortedByMultiplier = allOffers
      .filter(o => o.type === 'multiplier')
      .sort((a, b) => b.amount - a.amount);

    const sortedByFlat = allOffers
      .filter(o => o.type === 'flat')
      .sort((a, b) => b.amount - a.amount);

    /* --- Helper to create a result line --- */
    const createLine = (o) => {
      const line = document.createElement('div');
      line.className = 'c1-scraper-result-line';
      line.style.display = 'flex';
      line.style.alignItems = 'center';
      line.style.justifyContent = 'space-between';
      line.style.padding = '3px 6px';
      line.style.borderRadius = '3px';
      line.style.fontFamily = 'Arial, sans-serif';
      line.style.fontSize = '13px';
      line.style.cursor = 'pointer'; /* NEW (v17): Add cursor to whole line */
      line.onmouseover = () => line.style.backgroundColor = '#f0f8ff'; /* NEW (v17): Move hover to whole line */
      line.onmouseout = () => line.style.backgroundColor = 'transparent'; /* NEW (v17): Move hover to whole line */
      line.onclick = () => scrollToTile(o.tile); /* NEW (v17): Move scroll click to whole line */

      /* --- NEW (v16): Add data attributes for filtering --- */
      const isStarred = starredSet.has(o.merchant);
      line.dataset.starred = isStarred;
      line.dataset.merchant = o.merchant;

      /* Content part of the line */
      const content = document.createElement('span');
      content.style.flexGrow = '1';
      /* REMOVED (v17): Click and hover handlers moved to parent 'line'
      content.style.cursor = 'pointer';
      content.onmouseover = () => content.style.backgroundColor = '#f0f8ff';
      content.onmouseout = () => content.style.backgroundColor = 'transparent';
      content.onclick = () => scrollToTile(o.tile);
      */

      let displayLabel = '';
      if (o.type === 'percent') {
        displayLabel = `[${o.amount}%]`;
      } else if (o.type === 'multiplier') {
        displayLabel = `[${o.amount}X]`; /* Removed "miles" */
      } else if (o.type === 'flat') {
        if (o.label.startsWith('$')) {
          displayLabel = `[$${o.amount}]`;
        } else {
          displayLabel = `[${o.amount}]`; /* Removed "miles" */
        }
      } else {
        displayLabel = `[${o.label}]`; /* Fallback */
      }
      content.innerHTML = `${displayLabel} - ${o.merchant}`;
      
      /* --- NEW (v16): Star Button --- */
      const starButton = document.createElement('span');
      starButton.textContent = isStarred ? '★' : '☆';
      starButton.style.cursor = 'pointer';
      starButton.style.fontSize = '18px';
      starButton.style.color = isStarred ? '#f0c000' : '#ccc';
      starButton.style.marginLeft = '10px';
      starButton.style.padding = '0 5px';
      starButton.onmouseover = () => starButton.style.color = '#f0c000';
      starButton.onmouseout = () => starButton.style.color = (line.dataset.starred === 'true' ? '#f0c000' : '#ccc');
      
      starButton.onclick = (e) => {
        e.stopPropagation(); /* CRITICAL: Prevents line.onclick from firing */
        const currentlyStarred = line.dataset.starred === 'true';
        if (currentlyStarred) {
          removeStarredMerchant(o.merchant);
          starButton.textContent = '☆';
          starButton.style.color = '#ccc';
          line.dataset.starred = 'false';
        } else {
          addStarredMerchant(o.merchant);
          starButton.textContent = '★';
          starButton.style.color = '#f0c000';
          line.dataset.starred = 'true';
        }
        /* Re-apply filter if "Show starred only" is checked */
        if (starredFilterCheckbox.checked) {
          filterResults();
        }
      };

      /* --- NEW: Offer history pill if increased since last saved --- */
      try {
        const key = [o.merchant, o.label, o.link].join('|');
        let prev = prevMap.get(key);
        // Fallback: labels/links often change. Match by merchant + type,
        // and require channel only when both current and saved entries have it.
        if (!prev) {
          for (const p of prevMap.values()) {
            if (!p) continue;
            if (p.merchant !== o.merchant) continue;
            if (p.type !== o.type) continue;
            // If both have a non-empty channel, require it to match.
            const savedHasChannel = p.channel && String(p.channel).trim().length > 0;
            const curHasChannel = o.channel && String(o.channel).trim().length > 0;
            if (savedHasChannel && curHasChannel && p.channel !== o.channel) continue;
            // Accept this saved entry as the previous match.
            prev = p;
            break;
          }
        }

        if (prev && typeof prev.amount === 'number' && o.amount > prev.amount) {
          const delta = o.amount - prev.amount;
          line.dataset.increased = 'true';
          const pill = document.createElement('span');
          pill.style.marginLeft = '8px';
          pill.style.padding = '2px 6px';
          pill.style.fontSize = '11px';
          pill.style.background = '#e6ffed';
          pill.style.color = '#0a7a2e';
          pill.style.border = '1px solid #c7f0d0';
          pill.style.borderRadius = '12px';
          pill.style.whiteSpace = 'nowrap';
          let text = '';
          if (o.type === 'percent') {
            text = `+${delta}%`;
          } else if (o.type === 'multiplier') {
            text = `+${delta}X`;
          } else if (o.type === 'flat') {
            if (o.label && o.label.startsWith('$')) {
              text = `+$${delta}`;
            } else {
              text = `+${delta} miles`;
            }
          } else {
            text = `+${delta}`;
          }
          pill.textContent = text;
            // Add tooltip showing previous amount and saved date for context
            try {
              if (prev) {
                let prevLabel = '';
                if (prev.type === 'percent') prevLabel = `${prev.amount}%`;
                else if (prev.type === 'multiplier') prevLabel = `${prev.amount}X`;
                else if (prev.type === 'flat') {
                  if (prev.label && prev.label.startsWith('$')) prevLabel = `$${prev.amount}`;
                  else prevLabel = `${prev.amount} miles`;
                } else {
                  prevLabel = String(prev.amount);
                }
                const savedAtStr = prev.savedAt ? new Date(prev.savedAt).toLocaleString() : '';
                pill.title = `Previous: ${prevLabel}${savedAtStr ? ' — ' + savedAtStr : ''}`;
                pill.setAttribute('aria-label', pill.title);
              }
            } catch (err) {
              /* ignore tooltip errors */
            }
          /* put the pill next to the merchant text */
          content.appendChild(pill);
        } else {
          line.dataset.increased = 'false';
        }
      } catch (e) {
        try { line.dataset.increased = 'false'; } catch(_){ }
        /* ignore errors building history pill */
      }

      line.appendChild(content);
      line.appendChild(starButton);
      return line;
    };

    /* --- Percent List --- */
    const percentHeader = document.createElement('div');
    percentHeader.textContent = '--- OFFERS BY % BACK ---';
    percentHeader.style.fontWeight = 'bold';
    percentHeader.style.marginTop = '10px';
    percentHeader.id = 'c1-percent-header';
    resultsEl.appendChild(percentHeader);

    const percentList = document.createElement('div');
    percentList.id = 'c1-percent-list';
    if (sortedByPercent.length > 0) {
      sortedByPercent.forEach(o => percentList.appendChild(createLine(o)));
    } else {
      percentList.textContent = 'No percent-based offers found.';
      percentHeader.style.display = 'none'; /* Hide header if empty */
    }
    resultsEl.appendChild(percentList);

    /* --- Multiplier List --- */
    const multiplierHeader = document.createElement('div');
    multiplierHeader.textContent = '--- OFFERS BY X MILES ---';
    multiplierHeader.style.fontWeight = 'bold';
    multiplierHeader.style.marginTop = '15px';
    multiplierHeader.id = 'c1-multiplier-header';
    resultsEl.appendChild(multiplierHeader);

    const multiplierList = document.createElement('div');
    multiplierList.id = 'c1-multiplier-list';
    if (sortedByMultiplier.length > 0) {
      sortedByMultiplier.forEach(o => multiplierList.appendChild(createLine(o)));
    } else {
      multiplierList.textContent = 'No X-miles offers found.';
      multiplierHeader.style.display = 'none'; /* Hide header if empty */
    }
    resultsEl.appendChild(multiplierList);

    /* --- Flat Value List ($ and Miles) --- */
    const flatHeader = document.createElement('div');
    flatHeader.textContent = '--- FLAT OFFERS ---';
    flatHeader.style.fontWeight = 'bold';
    flatHeader.style.marginTop = '15px';
    flatHeader.id = 'c1-flat-header';
    resultsEl.appendChild(flatHeader);

    const flatList = document.createElement('div');
    flatList.id = 'c1-flat-list';
    if (sortedByFlat.length > 0) {
      sortedByFlat.forEach(o => flatList.appendChild(createLine(o)));
    } else {
      flatList.textContent = 'No flat $ or miles offers found.';
      flatHeader.style.display = 'none'; /* Hide header if empty */
    }
    resultsEl.appendChild(flatList);
  }

  /**
   * Scrolls to a specific offer tile and highlights it.
   * @param {HTMLElement} tile - The tile element to scroll to.
   */
  function scrollToTile(tile) {
    if (!tile) return;

    if (highlightedTile) {
      highlightedTile.style.outline = 'none';
      highlightedTile.style.boxShadow = ''; /* Reset */
      highlightedTile.style.borderRadius = '';
    }

    tile.scrollIntoView({ block: 'center' });

    /* Highlight new tile with fade helper */
    highlightElementFade(tile, 800);
    highlightedTile = tile;
  }

})();