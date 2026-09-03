/* SOLAH — catalogue
 *
 * PLACEHOLDER DATA. Every product name, price, material claim and description
 * below is invented for this build. Replace all of it before selling. Prices
 * are in paise-free rupees and are treated as GST-inclusive throughout, which
 * is what Indian shoppers expect the displayed price to mean.
 *
 * `image: null` renders the authored SVG illustration. Set it to a URL or a
 * local path ("assets/img/lattice-drops.jpg") and that product switches to a
 * real photograph with no other change anywhere in the codebase.
 */
(function (global) {
  'use strict';

  var CATEGORIES = [
    { slug: 'earrings',   name: 'Earrings',   deva: 'बालियाँ',  blurb: 'Studs, drops and hoops for every neckline.' },
    { slug: 'necklaces',  name: 'Necklaces',  deva: 'हार',      blurb: 'Layerable chains and one-piece statements.' },
    { slug: 'rings',      name: 'Rings',      deva: 'अँगूठी',   blurb: 'Stacking bands and solitaires that hold up daily.' },
    { slug: 'bags',       name: 'Bags',       deva: 'बैग',      blurb: 'Slings, totes and potlis sized for real days.' },
    { slug: 'sunglasses', name: 'Sunglasses', deva: 'चश्मा',    blurb: 'UV400 frames cut for Indian face shapes.' },
    { slug: 'watches',    name: 'Watches',    deva: 'घड़ी',      blurb: 'Slim dials that read as jewellery.' },
    { slug: 'hair',       name: 'Hair',       deva: 'बाल',      blurb: 'Claw clips and silk scrunchies that hold.' },
    { slug: 'scarves',    name: 'Scarves',    deva: 'दुपट्टा',  blurb: 'Mulberry silk squares and long stoles.' }
  ];

  var OCCASIONS = [
    { slug: 'wedding',  name: 'Wedding',  blurb: 'Shaadi season, sangeet, reception.' },
    { slug: 'work',     name: 'Work',     blurb: 'Office, client meetings, travel days.' },
    { slug: 'festive',  name: 'Festive',  blurb: 'Diwali, Karwa Chauth, Raksha Bandhan.' },
    { slug: 'everyday', name: 'Everyday', blurb: 'Coffee runs, college, weekend plans.' }
  ];

  function p(o) { return o; }

  var PRODUCTS = [
    /* ---- earrings ---- */
    p({ id: 'e1', cat: 'earrings', name: 'Lattice Drop Earrings', price: 1499, mrp: 2299,
        metal: 'gold', stone: '#1E6F53', occasion: ['wedding', 'festive'],
        material: '925 sterling silver, 18k gold plated', stone_name: 'Green onyx',
        weight: '4.2 g (pair)', warranty: '6-month plating warranty',
        desc: 'A faceted drop on a fine hook, cut so it catches light from across a room. Light enough for a full evening — the pair weighs about as much as a one-rupee coin.',
        care: 'Wipe with the enclosed cloth after wear. Keep away from perfume and water.',
        finishWith: ['b2', 'r1'], badge: null }),
    p({ id: 'e2', cat: 'earrings', name: 'Everyday Huggie Hoops', price: 899, mrp: 1299,
        metal: 'gold', stone: '#C9A24B', occasion: ['everyday', 'work'],
        material: '925 sterling silver, 18k gold plated', stone_name: '—',
        weight: '2.1 g (pair)', warranty: '6-month plating warranty',
        desc: 'The pair you stop taking off. Snug enough to sleep in, plain enough for a client call, warm enough to wear with everything else here.',
        care: 'Rinse and dry if worn through a workout.',
        finishWith: ['w1', 'n2'], badge: null }),
    p({ id: 'e3', cat: 'earrings', name: 'Meena Jhumka', price: 2499, mrp: 3499,
        metal: 'gold', stone: '#9C2B4E', occasion: ['wedding', 'festive'],
        material: 'Brass base, 18k gold plated, hand-set enamel', stone_name: 'Enamel + pearl drop',
        weight: '9.4 g (pair)', warranty: '6-month plating warranty',
        desc: 'A jhumka with hand-laid enamel in the meenakari tradition, finished with a freshwater pearl fringe. Made in Jaipur.',
        care: 'Store flat in the pouch. Enamel chips if knocked against hard surfaces.',
        finishWith: ['s3', 'n1'], badge: 'Handmade' }),

    /* ---- necklaces ---- */
    p({ id: 'n1', cat: 'necklaces', name: 'Temple Coin Necklace', price: 3299, mrp: 4599,
        metal: 'gold', stone: '#9C2B4E', occasion: ['wedding', 'festive'],
        material: 'Brass base, 18k gold plated', stone_name: 'Kundan-set glass',
        weight: '28 g', warranty: '6-month plating warranty',
        desc: 'A single coin pendant on a flat curb chain, sized to sit just below the collarbone on a high neckline.',
        care: 'Last on, first off. Remove before bathing.',
        finishWith: ['e3', 'g1'], badge: null }),
    p({ id: 'n2', cat: 'necklaces', name: 'Fine Rope Chain', price: 1299, mrp: 1899,
        metal: 'gold', stone: '#C9A24B', occasion: ['everyday', 'work'],
        material: '925 sterling silver, 18k gold plated', stone_name: '—',
        weight: '3.8 g', warranty: '6-month plating warranty',
        desc: 'A 16-inch rope chain built to layer. Wears alone on a work day and disappears under a collar.',
        care: 'Undo knots with a pin, never by pulling.',
        finishWith: ['e2', 'w2'], badge: 'Layering pick' }),
    p({ id: 'n3', cat: 'necklaces', name: 'Emerald Line Pendant', price: 2199, mrp: 2999,
        metal: 'silver', stone: '#1E6F53', occasion: ['work', 'wedding'],
        material: '925 sterling silver, rhodium finished', stone_name: 'Lab-grown emerald',
        weight: '5.1 g', warranty: '6-month finish warranty',
        desc: 'One stone, one line, nothing else. The piece for someone who finds most jewellery too loud.',
        care: 'Polish with a dry cloth. Rhodium dulls with lotion.',
        finishWith: ['r2', 'g2'], badge: null }),

    /* ---- rings ---- */
    p({ id: 'r1', cat: 'rings', name: 'Solitaire Stacking Ring', price: 1699, mrp: 2399,
        metal: 'gold', stone: '#1E6F53', occasion: ['wedding', 'everyday'],
        material: '925 sterling silver, 18k gold plated', stone_name: 'Green onyx',
        weight: '2.4 g', warranty: '6-month plating warranty',
        desc: 'A low-set stone that clears a coat pocket. Built to stack with the band below it.',
        care: 'Remove before gym and cooking.',
        finishWith: ['e1', 'r3'], badge: null }),
    p({ id: 'r2', cat: 'rings', name: 'Plain Band, 2mm', price: 799, mrp: 1199,
        metal: 'silver', stone: '#C3C7CC', occasion: ['everyday', 'work'],
        material: '925 sterling silver', stone_name: '—',
        weight: '1.8 g', warranty: '6-month finish warranty',
        desc: 'The band that makes everything else look deliberate. Comfort-fit inner curve, no edge to catch.',
        care: 'Silver polish cloth restores shine.',
        finishWith: ['n3', 'r1'], badge: null }),
    p({ id: 'r3', cat: 'rings', name: 'Ruby Signet', price: 2899, mrp: 3999,
        metal: 'gold', stone: '#9C2B4E', occasion: ['festive', 'wedding'],
        material: 'Brass base, 18k gold plated', stone_name: 'Lab-grown ruby',
        weight: '5.6 g', warranty: '6-month plating warranty',
        desc: 'A flat-top signet with a bezel-set stone. Reads heirloom, costs a fraction of one.',
        care: 'Keep away from chlorine.',
        finishWith: ['w3', 'e3'], badge: null }),

    /* ---- bags ---- */
    p({ id: 'g1', cat: 'bags', name: 'Potli Sling, Silk', price: 2799, mrp: 3899,
        metal: 'gold', stone: '#9C2B4E', occasion: ['wedding', 'festive'],
        material: 'Mulberry silk, cotton lining, brass hardware', stone_name: '—',
        weight: '210 g', warranty: '6-month hardware warranty',
        desc: 'A potli reworked with a detachable chain so it works as a sling. Holds a phone, a lipstick and a folded dupatta.',
        care: 'Spot clean only. Do not machine wash.',
        finishWith: ['n1', 'e3'], badge: 'Wedding edit' }),
    p({ id: 'g2', cat: 'bags', name: 'Structured Work Tote', price: 4299, mrp: 5999,
        metal: 'gold', stone: '#3C3733', occasion: ['work'],
        material: 'Vegan leather, canvas lining', stone_name: '—',
        weight: '640 g', warranty: '12-month stitching warranty',
        desc: 'Fits a 14-inch laptop flat, with a padded sleeve and a base that stays square when the bag is half empty.',
        care: 'Wipe with a damp cloth. Keep out of direct sun.',
        finishWith: ['n3', 'w2'], badge: null }),
    p({ id: 'g3', cat: 'bags', name: 'Everyday Mini Sling', price: 1599, mrp: 2299,
        metal: 'silver', stone: '#6E645B', occasion: ['everyday'],
        material: 'Vegan leather, adjustable webbing strap', stone_name: '—',
        weight: '180 g', warranty: '6-month hardware warranty',
        desc: 'Phone, cards, keys, earphones — nothing more, which is the point. Strap adjusts from crossbody to shoulder.',
        care: 'Wipe clean.',
        finishWith: ['s1', 'e2'], badge: null }),

    /* ---- sunglasses ---- */
    p({ id: 's1', cat: 'sunglasses', name: 'Marine Square Frames', price: 1899, mrp: 2699,
        metal: 'gold', stone: '#2B3A4A', occasion: ['everyday', 'work'],
        material: 'Acetate frame, UV400 polarised lens', stone_name: 'Gradient smoke',
        weight: '28 g', warranty: '12-month frame warranty',
        desc: 'A square frame with a slightly raised bridge, cut to sit properly on a lower nose bridge instead of sliding.',
        care: 'Use the hard case. Never rest lens-down.',
        finishWith: ['g3', 'e2'], badge: 'UV400' }),
    p({ id: 's2', cat: 'sunglasses', name: 'Cat-Eye, Tortoise', price: 2199, mrp: 3099,
        metal: 'gold', stone: '#6B4423', occasion: ['everyday', 'festive'],
        material: 'Acetate frame, UV400 lens', stone_name: 'Tortoise shell',
        weight: '26 g', warranty: '12-month frame warranty',
        desc: 'A soft cat-eye that flatters a round face without tipping into costume.',
        care: 'Rinse with water before wiping to avoid scratching.',
        finishWith: ['e1', 'g1'], badge: null }),
    p({ id: 's3', cat: 'sunglasses', name: 'Gold Aviators', price: 2499, mrp: 3499,
        metal: 'gold', stone: '#8A6520', occasion: ['everyday', 'wedding'],
        material: 'Stainless steel frame, UV400 polarised lens', stone_name: 'Bronze gradient',
        weight: '31 g', warranty: '12-month frame warranty',
        desc: 'The aviator, kept narrow so it does not swallow a smaller face. Adjustable silicone nose pads.',
        care: 'Tighten hinge screws yearly.',
        finishWith: ['w1', 'e3'], badge: null }),

    /* ---- watches ---- */
    p({ id: 'w1', cat: 'watches', name: 'Slim Mesh Watch', price: 3499, mrp: 4899,
        metal: 'gold', stone: '#F0EAE0', occasion: ['work', 'everyday'],
        material: 'Stainless steel, mesh strap, quartz movement', stone_name: 'Mother-of-pearl dial',
        weight: '52 g', warranty: '12-month movement warranty',
        desc: 'A 32mm case on a mesh strap that shortens without a tool. Reads as a bracelet from a metre away.',
        care: 'Splash resistant, not swim resistant.',
        finishWith: ['e2', 'n2'], badge: null }),
    p({ id: 'w2', cat: 'watches', name: 'Office Leather Watch', price: 2999, mrp: 4199,
        metal: 'silver', stone: '#22303C', occasion: ['work'],
        material: 'Stainless steel, genuine leather strap, quartz movement', stone_name: 'Navy sunray dial',
        weight: '46 g', warranty: '12-month movement warranty',
        desc: 'Legible at a glance in a meeting: applied indices, no clutter, a date window that is actually readable.',
        care: 'Keep the leather dry.',
        finishWith: ['g2', 'r2'], badge: null }),
    p({ id: 'w3', cat: 'watches', name: 'Festive Gold Bracelet Watch', price: 4999, mrp: 6999,
        metal: 'gold', stone: '#7C1F3D', occasion: ['festive', 'wedding'],
        material: 'Stainless steel, gold ion plating, quartz movement', stone_name: 'Maroon dial',
        weight: '78 g', warranty: '12-month movement warranty',
        desc: 'Built to be worn with bangles and not lose the argument. Fold-over clasp with a safety catch.',
        care: 'Remove before applying mehendi.',
        finishWith: ['r3', 'n1'], badge: null }),

    /* ---- hair ---- */
    p({ id: 'h1', cat: 'hair', name: 'Silk Scrunchie, Set of 3', price: 599, mrp: 899,
        metal: 'gold', stone: '#9C2B4E', occasion: ['everyday'],
        material: '100% mulberry silk, covered elastic', stone_name: '—',
        weight: '18 g (set)', warranty: '—',
        desc: 'Silk instead of cotton because it does not drag on hair. Three shades that go with everything in this store.',
        care: 'Hand wash cold, dry flat.',
        finishWith: ['e2', 'g3'], badge: null }),
    p({ id: 'h2', cat: 'hair', name: 'Tortoise Claw Clip', price: 499, mrp: 749,
        metal: 'gold', stone: '#6B4423', occasion: ['everyday', 'work'],
        material: 'Cellulose acetate, steel spring', stone_name: '—',
        weight: '22 g', warranty: '—',
        desc: 'Holds thick Indian hair without the spring giving up in a week. Tested on hair past the waist.',
        care: 'Do not force past its opening.',
        finishWith: ['s2', 'e2'], badge: 'Under ₹500' }),
    p({ id: 'h3', cat: 'hair', name: 'Pearl Pin Set', price: 899, mrp: 1299,
        metal: 'gold', stone: '#F0EAE0', occasion: ['wedding', 'festive'],
        material: 'Brass base, 18k gold plated, freshwater pearl', stone_name: 'Freshwater pearl',
        weight: '11 g (set of 6)', warranty: '6-month plating warranty',
        desc: 'Six pins that turn a plain bun into something finished. Works in a braid too.',
        care: 'Store in the box so the pearls do not rub.',
        finishWith: ['e3', 'n1'], badge: null }),

    /* ---- scarves ---- */
    p({ id: 'k1', cat: 'scarves', name: 'Mulberry Silk Square', price: 1799, mrp: 2499,
        metal: 'gold', stone: '#1E6F53', occasion: ['work', 'everyday'],
        material: '100% mulberry silk, hand-rolled hem', stone_name: '—',
        weight: '42 g', warranty: '—',
        desc: 'A 65cm square with a hand-rolled hem. Ties at the neck, on a bag handle, or over hair in a car.',
        care: 'Dry clean, or hand wash cold and dry in shade.',
        finishWith: ['g2', 's1'], badge: null }),
    p({ id: 'k2', cat: 'scarves', name: 'Wool Blend Stole', price: 2299, mrp: 3199,
        metal: 'silver', stone: '#7C1F3D', occasion: ['festive', 'work'],
        material: '70% wool, 30% viscose', stone_name: '—',
        weight: '210 g', warranty: '—',
        desc: 'Warm enough for a Delhi December, light enough to fold into a tote by noon.',
        care: 'Dry clean only.',
        finishWith: ['w2', 'n3'], badge: null }),
    p({ id: 'k3', cat: 'scarves', name: 'Printed Chiffon Dupatta', price: 1299, mrp: 1899,
        metal: 'gold', stone: '#C9A24B', occasion: ['festive', 'wedding'],
        material: 'Chiffon, gold-tone sequin edge', stone_name: '—',
        weight: '96 g', warranty: '—',
        desc: 'A light dupatta that drapes rather than sits. The sequin edge is stitched, not glued.',
        care: 'Hand wash separately. Colour may bleed on first wash.',
        finishWith: ['e3', 'h3'], badge: null })
  ];

  /* Derived helpers ------------------------------------------------------ */

  /* The drawn form for each product. A huggie hoop is drawn as a hoop and a
     plain band is drawn without a stone: the illustration must never
     contradict the product name. */
  var FORMS = {
    e1: 'drop',        e2: 'hoop',           e3: 'jhumka',
    n1: 'pendant-coin', n2: 'chain',         n3: 'pendant-line',
    r1: 'solitaire',   r2: 'band',           r3: 'signet',
    g1: 'potli',       g2: 'tote',           g3: 'sling',
    s1: 'square',      s2: 'cateye',         s3: 'aviator',
    w1: 'watch-mesh',  w2: 'watch-leather',  w3: 'watch-bracelet',
    h1: 'scrunchie',   h2: 'claw',           h3: 'pins',
    k1: 'silk-square', k2: 'stole',          k3: 'dupatta'
  };

  PRODUCTS.forEach(function (prod) {
    prod.image = null;                       // set to a URL/path to use a photo
    prod.form = FORMS[prod.id] || prod.cat;
    prod.off = Math.round((1 - prod.price / prod.mrp) * 100);
    prod.cod = prod.price >= 500;            // COD floor
  });

  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }

  function categoryOf(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    return null;
  }

  global.SolahData = {
    products: PRODUCTS,
    categories: CATEGORIES,
    occasions: OCCASIONS,
    byId: byId,
    categoryOf: categoryOf,
    FREE_SHIP_OVER: 999,
    PREPAID_OFF: 5,            // % off for paying online instead of COD
    COD_FEE: 49
  };
})(window);
