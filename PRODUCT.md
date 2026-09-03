# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS — user's explicit choice. No build step, no framework. The
site must open from the filesystem and deploy to any static host (Netlify,
Vercel, GitHub Pages, Hostinger). This constrains later work: no React, no
bundler, no server runtime. Any dynamic behaviour (cart, filters, pincode
check) is client-side JS against in-file data.

## Users

Primary: women aged 18–34 in Indian metros and tier-2 cities (Delhi NCR,
Mumbai, Bengaluru, Pune, Hyderabad, Jaipur, Lucknow, Indore), shopping on a
phone over 4G, usually in short evening sessions. They are buying the piece
that finishes an outfit already chosen — for work, a wedding, a festival, a
date, or a gift.

Their situation shapes every decision:

- Phone-first. Desktop is the minority session.
- Price-aware and comparison-trained. They have Meesho, Amazon and Instagram
  open in other tabs.
- Burned before by jewellery that turned green, bags whose straps tore, and
  photos that did not match the parcel. Scepticism is the default state.
- Cash on delivery is the trust instrument, not a payment preference — it is
  how they buy from a brand they do not yet know.

Secondary: men buying gifts (partner, sister, mother), especially around
Raksha Bandhan, Diwali, Valentine's Day and birthdays. They arrive with less
category knowledge and need guidance, gifting framing, and reassurance about
returns if the recipient dislikes it.

## Product Purpose

SOLAH is a multi-category accessories store: jewellery, bags, sunglasses,
watches, hair and scarves under one brand. It exists to be the single place an
Indian shopper finishes an outfit, instead of assembling accessories from four
different marketplaces of uncertain quality.

Success is a completed, paid order — and, more importantly, a second order.
The site is the entire sales floor: there is no store, no sales assistant, and
no second chance at the first impression.

## Positioning

The name is the position. *Solah shringar* — the sixteen adornments — is a
recognised Indian idea about what completes a person. SOLAH is the modern
sixteen: not the outfit, the things that finish it.

The defensible mechanism is **the multi-category finish**. A jewellery brand
sells you earrings. A bag brand sells you a bag. SOLAH sells the complete
finish for one occasion — earrings, bag and sunglasses that were chosen to
work together — which no single-category competitor can truthfully offer.
Category-led navigation plus occasion-led curation is the structural
expression of this, and it is why the catalog is organised two ways.

## Operating Context

Indian ecommerce reality that the site must be designed around, not retrofitted:

- **COD is decisive.** A large share of first orders in this segment are cash
  on delivery. Hiding or de-emphasising it costs conversions outright.
- **UPI is the dominant prepaid rail**, ahead of cards. Wallets and net
  banking still matter. Payment logos are trust signals before they are
  functional affordances.
- **Pincode determines the promise.** Delivery time and COD availability vary
  by pincode. Shoppers expect to check before committing.
- **Shipping thresholds move basket size.** "Free delivery over ₹999" is a
  standard and effective AOV lever in this market.
- **Returns anxiety gates the first purchase.** A visible, plain-language
  return and exchange window does more for conversion than a discount.
- **The festive calendar is the demand curve.** Diwali, Karwa Chauth, Raksha
  Bandhan, wedding season and Valentine's Day are the peaks. The site must be
  able to carry an occasion-led merchandising layer.
- **WhatsApp is the support channel** Indian shoppers actually use.
- **Prices are shown GST-inclusive.** Indian shoppers expect the displayed
  price to be the price paid.

## Capabilities and Constraints

Confirmed scope:

- Multi-category catalog: jewellery (earrings, necklaces, rings), bags,
  sunglasses, watches, hair accessories, scarves.
- Category-led navigation as the primary structure; occasion-led curation as a
  secondary path.
- Product listing with filtering and sorting; product detail; cart; a checkout
  that presents COD and prepaid options.
- Pincode delivery/COD checker.
- Price band roughly ₹499–₹4,999 across categories.

Constraints:

- Static site. No backend, no database, no real payment processing. Checkout
  is a designed, functional-feeling front end; it cannot take money. This must
  never be presented to a visitor as a live transaction.
- No product photography exists. See Evidence on Hand.
- No build step permitted.

Undecided, and not to be invented later without asking:

- Whether real fulfilment runs on Shopify, WooCommerce or a custom backend.
- Actual shipping partner, real delivery SLAs, and real return-window terms.
- Legal entity name, GSTIN, registered address, and customer support number.

## Brand Commitments

The brand is invented for this build at the user's explicit instruction
("invent everything"). Nothing here is inherited from a real business, and
every element below is a placeholder the user can replace.

- **Name:** SOLAH.
- **Meaning:** sixteen — from *solah shringar*, the sixteen adornments. The
  brand should be able to state this plainly; it is the reason the name earns
  its place.
- **Voice:** direct, warm, unfussy, quietly confident. Indian-English as
  actually spoken, without either mall-brand gloss or heavy Sanskritised
  formality. Never breathless. Never "Hurry! Limited stock!!" as a personality.
- **Scope of invention:** name, wordmark, palette, typography, product names,
  prices, and copy are all placeholder and must be labelled as such in any
  handoff to the user.

**Standing visual preference (user-chosen, durable).** Offered a set of
distinctive visual directions, the user deliberately chose the category
standard: the familiar Indian D2C accessories storefront — light ground,
editorial serif display, generous whitespace, photography-led, quiet product
grid, restrained accents. This is a binding commitment, not a fallback. Future
work executes this convention at full fidelity and does not smuggle in
quirk, irony, or a competing visual world. The craft bar, delegated to
Impeccable by the user, is Giva-level India-fluency executed at Mejuri-level
finish.

**Imagery decision.** The user asked for real stock photography. Every image
host (Unsplash, Pexels, Pixabay) is blocked by this environment's network
policy, and no image generation is available, so no stock photograph could be
sourced or verified. Shipping unverified hotlinks was rejected as it would
produce broken images in a live storefront. The build therefore ships
hand-authored CSS/SVG product renderings in correctly-proportioned slots, with
the photography path pre-wired: every product carries a single `image` field
that, when given a URL or local path, replaces the rendering with no other
change. Swapping in real photography is a data edit, not a rebuild.

## Evidence on Hand

**None.** This is the constraint that most shapes the build.

- No product photography, no lifestyle imagery, no logo files, no brand assets.
- No image generation tool is available in this session, so photography cannot
  be produced either. The design must therefore be **built to survive without
  photographs** — carrying its quality through typography, layout, colour,
  material rendering in CSS, and drawn/SVG forms — and must leave clearly
  marked, correctly-proportioned slots the user drops real photography into.
  A design that only works once someone supplies great photos is a failure of
  this brief.
- No real customers, reviews, ratings, press mentions, awards, sales figures,
  founder story, or certifications exist.

**Fabrication boundary.** Testimonials, star ratings, review counts, press
logos, "as seen in", follower counts, "10,000+ happy customers", trustmarks,
BIS hallmark claims and certification badges must not be presented as real.
Where the conversion pattern genuinely requires such a slot, it ships visibly
empty or explicitly labelled as placeholder. Inventing social proof for a
store that will take real money from real people is out of scope, permanently.

## Product Principles

1. **Earn the first order from a stranger.** Every surface assumes the visitor
   has never heard of SOLAH and has been disappointed before. Trust is
   constructed, not asserted.
2. **The phone is the product.** Design mobile-first and judge every decision
   at 390px before 1440px. Thumb reach, one-hand use, and 4G weight are
   functional requirements.
3. **The finish, not the item.** Merchandising, copy and cross-sell express
   the multi-category position — pieces that complete each other — rather than
   presenting six unrelated departments.
4. **Say the real thing.** Prices GST-inclusive, delivery windows plain,
   returns in plain language, COD stated openly. Clarity converts better than
   pressure in a market this sceptical.
5. **Never fake proof.** No invented reviews, ratings, press or certifications.
   Placeholder slots stay visibly placeholder.

## Accessibility & Inclusion

- Mobile-first down to 360px; usable one-handed.
- Indian English throughout; ₹ with Indian digit grouping (₹1,49,999 style
  where the number warrants it).
- WCAG AA contrast as a floor, verified rather than assumed.
- Must remain usable on mid-range Android over 4G: no heavy hero media, no
  layout that depends on hover, touch targets at 44px minimum.
- Full keyboard operability and visible focus states for every interactive
  element, including the cart and filters.
