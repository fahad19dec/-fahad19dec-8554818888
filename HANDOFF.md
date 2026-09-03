# SOLAH — handoff

A static storefront for a multi-category Indian accessories brand. No build step,
no framework, no dependencies. Open `index.html` in a browser and it runs.

**SOLAH is an invented placeholder brand.** The name, logo, product names,
prices, material claims and copy were all authored for this build. None of it
describes a real business. Replace it before you sell anything.

---

## Files

| Path | What it is |
|---|---|
| `index.html` | Homepage — hero, categories, occasion edits, savings, newsletter |
| `shop.html` | Listing page — filter by category, occasion, price; sort |
| `product.html` | Product page — gallery, variants, pincode check, specs, cross-sell |
| `cart.html` | Cart, payment choice, itemised total, demo checkout |
| `assets/css/solah.css` | The entire stylesheet |
| `assets/js/data.js` | The catalogue — **edit this to change products** |
| `assets/js/art.js` | Hand-drawn SVG product illustrations |
| `assets/js/store.js` | Cart, filters, pincode, rendering |

Deep links work: `shop.html?cat=earrings`, `product.html?id=e3`.

---

## Before you go live

These are the things that are demonstrated but not real. Each one will take
money from customers incorrectly, or break a promise, if shipped as-is.

### 1. Checkout takes no money

`cart.html` has a working cart and a **demo** "Place order" button. There is no
payment gateway, no order is created, and nothing is charged. Wire up Razorpay,
PayU or Cashfree — all three support UPI, cards, net banking and wallets, and all
three are the normal choice for an Indian store. Handle COD as a separate order
type that skips the payment step.

Nothing persists server-side: the cart lives in `localStorage` in the shopper's
own browser and is lost when they clear site data.

### 2. The pincode checker is fake

`pincode()` in `store.js` derives a delivery window from the pincode's first
digit so the interaction is consistent and demonstrable. It does **not** know
your courier's serviceability. Replace it with a call to your logistics
provider's API (Shiprocket, Delhivery and Bluedart all expose one) before you
promise anyone a delivery date.

### 3. Every product claim is invented

Materials, weights, warranties, country of origin and care instructions in
`data.js` are placeholder text. Legally, "925 sterling silver" and "18k gold
plated" are claims you must be able to substantiate. Replace them with your
real specifications.

### 4. There are no reviews, and none were faked

The reviews module on the homepage ships as a deliberate, visible empty state.
Fabricating reviews or ratings is prohibited under the Consumer Protection Act
2019 and the BIS review standard (IS 19000:2022). No invented testimonials, star
ratings, review counts, press logos or trust badges appear anywhere in this
build. Connect a real review provider (Judge.me, Loox, Yotpo) once you have
customers.

A finish review caught two claims that had slipped past this rule and they were
removed: a `Bestseller` badge on one product, and empty-cart copy reading "start
with what people buy most." Both asserted other customers' behaviour for a store
that has had no customers. **Watch for this when you edit copy** — the tempting
phrases are the ones that imply a sales history you do not have yet.

The badges that remain are safe because none of them describes anyone else's
behaviour: `Handmade` and `UV400` are product facts, `Under ₹500` is a price
fact, and `Wedding edit` and `Layering pick` are your own editorial choices.

### 5. Legal pages and business identity

Footer links to Terms, Privacy, Returns, Shipping and Cancellation are `#`
placeholders. Indian ecommerce rules require a published returns policy, a
grievance officer, and your legal entity name, registered address and GSTIN.
The WhatsApp button links nowhere — point it at
`https://wa.me/91XXXXXXXXXX`.

---

## Swapping in real photography

Photography was requested but no image host was reachable from the build
environment and no image generation was available, so the products ship as
hand-drawn SVG illustrations. They are stylised on purpose — they never pretend
to be photographs.

The photo path is already wired. In `assets/js/data.js`, each product has an
`image` field that is `null`. Give it a path or URL:

```js
p({ id: 'e1', cat: 'earrings', name: 'Lattice Drop Earrings', /* … */ })
// then, in the derived block at the bottom, or per product:
prod.image = 'assets/img/lattice-drops.jpg';
```

That product immediately renders a real `<img>` everywhere it appears — grid,
product page, cart — with no other change. Shoot **4:5 portrait** (e.g.
1200×1500) so nothing needs re-cropping.

To switch the whole catalogue at once, set `prod.image` inside the
`PRODUCTS.forEach` block in `data.js` from a filename convention such as
`'assets/img/' + prod.id + '.jpg'`.

---

## Editing the catalogue

Add a product by copying an entry in `data.js`. Required fields: `id`, `cat`,
`name`, `price`, `mrp`, `metal` (`gold` / `silver` / `rose`), `stone` (a hex
colour), `occasion` (array), plus the spec fields.

Then map it to a drawn form in the `FORMS` object below the catalogue, choosing
one of: `drop`, `hoop`, `jhumka`, `chain`, `pendant-coin`, `pendant-line`,
`band`, `solitaire`, `signet`, `tote`, `sling`, `potli`, `square`, `cateye`,
`aviator`, `watch-mesh`, `watch-leather`, `watch-bracelet`, `scrunchie`,
`claw`, `pins`, `silk-square`, `stole`, `dupatta`.

**Draw what the product actually is.** A huggie hoop drawn as a drop, or a plain
band drawn with a stone, is the exact kind of mismatch that makes a first-time
buyer distrust an unfamiliar store.

Commerce settings live at the bottom of `data.js`:

```js
FREE_SHIP_OVER: 999,   // free-delivery threshold, drives the cart meter
PREPAID_OFF: 5,        // % discount for paying online instead of COD
COD_FEE: 49            // cash-on-delivery handling fee
```

---

## Conversion mechanics already built in

Deliberate choices, not decoration:

- **COD stated everywhere** — a large share of first orders from an unknown
  Indian brand are cash on delivery. It appears in the announcement bar, the
  hero, the trust strip, product cards and checkout.
- **Prepaid discount (5%)** — the standard lever for shifting orders off COD,
  which is where the margin leaks.
- **Free-delivery meter** — tells the shopper exactly how much more to add. The
  most reliable basket-size lever in this market.
- **Pincode check on the product page** — answers "when will it reach me" before
  the add-to-cart decision, not after.
- **GST-inclusive pricing, stated** — Indian shoppers expect the shown price to
  be the price paid, and a surprise line at checkout is a common abandon point.
- **Returns in plain language** — a visible 7-day window does more for a first
  order than a discount.
- **Cross-sell as "Complete the finish"** — the multi-category position made
  operable, rather than a generic "you may also like" row.
- **No fake urgency** — no countdown timers, no invented stock counts. This
  market is sceptical enough that manufactured pressure reads as a scam signal.

---

## Deploying

It is a static site. Drag the folder onto Netlify, or:

```bash
npx vercel deploy --prod      # or
npx netlify deploy --prod
```

GitHub Pages, Cloudflare Pages, Hostinger and any shared host work too. There is
nothing to build and nothing to install.

Fonts (Bodoni Moda, Archivo, Mukta) load from Google Fonts. They were blocked in
the build environment, so screenshots taken during development show fallback
faces; they resolve normally on any ordinary host. To self-host them instead,
download the families and replace the `<link>` in each page's `<head>`.

---

## Accessibility and browser support

Built and verified for: full keyboard operation with visible focus rings, 44px
minimum touch targets, WCAG AA contrast on body text, `prefers-reduced-motion`
support, correct landmarks and a skip link, and no horizontal scroll at any width
from 360px up. Verified in Chromium at 390px and 1440px.

`localStorage` access is wrapped in `try/catch`, so the site still works in
private-browsing modes that throw on access — the cart simply does not persist.
