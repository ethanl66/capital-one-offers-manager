# Capital One Offers Manager

This repository contains bookmarklet-style scripts used to parse, inspect, and compare offers found on the Capital One Shopping / Offers pages. The development build (`capital_one_offers_sorter_dev.js`) injects an in-page widget that helps you find, scroll, parse, filter, and save notable offers (percent back, miles multipliers, and flat offers). The stable build (`capital_one_offers_sorter.js`) is a verified working build but might not have some developmental features that the dev build has.

## Files
- `capital_one_offers_sorter_dev.js` — Dev version
- `capital_one_offers_sorter.js` — Stable version

## Features (dev)
- Floating scraper widget injected into the page with a compact header and expandable body.
- "Find & Scroll to 'View More'" button: finds and highlights the page's load-more control so you can expand the list of offers.
 - `Load All Offers` button: automatically scrolls and clicks the page's load-more control until all offers are loaded so you can parse everything at once.
 - `Show Loaded Offers`: parses visible offers into three categories — percent back, X miles multipliers, and flat offers (dollars or fixed miles).
- Comparison against previously saved offers to surface new or increased offers.
- Filters: search by text, show starred merchants only, show increased offers only.
- Starred merchants management (add/remove), saved to `localStorage`.
- Quick jump navigation that scrolls to and highlights specific offer tiles on the page.

## Quick Usage
1. Open the Capital One Offers page in your browser.
2. Paste the following code into a bookmarklet URL and click it on the C1 offers page: Right-click your bookmarks bar, select "Add page...", and paste the following code into the URL field.
```javascript
javascript:(function(){
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/gh/ethanl66/capital-one-offers-manager@main/capital_one_offers_sorter.js';
  s.onload=function(){console.log('C1 script loaded')};
  s.onerror=function(e){console.error('failed to load script',e)};
  document.head.appendChild(s);
})();
```
3. Use the widget controls:
  - `Load All Offers` — automatically scrolls through the page and clicks the site's "View More Offers" controls until all offers are loaded.
  - `Show Loaded Offers` — collect and display parsed offers in the widget.
  - `Clear Results` — clear parsed results and return the UI to compact mode.
4. Use the search box and checkboxes to filter results; click a parsed row to scroll to the offer tile on the page.
