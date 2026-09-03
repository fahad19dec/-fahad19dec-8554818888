/* SOLAH — store behaviour
 * No modules, no fetch, no build step: the site runs from the filesystem.
 */
(function (global) {
  'use strict';

  var D = global.SolahData;
  var Art = global.SolahArt;

  /* ---- helpers ---------------------------------------------------------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Indian digit grouping: 1,49,999 rather than 149,999. */
  function money(n) {
    return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(global.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  /* localStorage is unavailable in some privacy modes and throws on access
     rather than returning null, so every use is guarded. */
  var store = {
    get: function (k, fallback) {
      try {
        var v = global.localStorage.getItem(k);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { global.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* non-fatal */ }
    }
  };

  /* ---- product media ---------------------------------------------------- */

  /* One place decides photo vs illustration, so swapping in real photography
     is a data change (`product.image`) and nothing else. */
  function media(prod, sizes) {
    if (prod.image) {
      return '<img src="' + esc(prod.image) + '" alt="' + esc(prod.name) + '" loading="lazy" ' +
             (sizes ? 'sizes="' + esc(sizes) + '" ' : '') + 'width="400" height="500">';
    }
    return Art.svg(prod.form, prod.metal, prod.stone, prod.name);
  }

  /* ---- cart ------------------------------------------------------------- */

  var cart = {
    items: store.get('solah.cart', []),

    save: function () { store.set('solah.cart', this.items); this.emit(); },

    emit: function () {
      var n = this.count();
      $$('[data-cart-count]').forEach(function (el) {
        el.textContent = n;
        el.hidden = n === 0;
      });
      document.dispatchEvent(new CustomEvent('cart:change'));
    },

    count: function () {
      return this.items.reduce(function (a, i) { return a + i.qty; }, 0);
    },

    add: function (id, qty) {
      var existing = null;
      for (var i = 0; i < this.items.length; i++) if (this.items[i].id === id) existing = this.items[i];
      if (existing) existing.qty += (qty || 1);
      else this.items.push({ id: id, qty: qty || 1 });
      this.save();
    },

    setQty: function (id, qty) {
      this.items = this.items.filter(function (i) {
        if (i.id !== id) return true;
        i.qty = qty;
        return qty > 0;
      });
      this.save();
    },

    remove: function (id) {
      this.items = this.items.filter(function (i) { return i.id !== id; });
      this.save();
    },

    subtotal: function () {
      return this.items.reduce(function (a, i) {
        var p = D.byId(i.id);
        return a + (p ? p.price * i.qty : 0);
      }, 0);
    },

    mrpTotal: function () {
      return this.items.reduce(function (a, i) {
        var p = D.byId(i.id);
        return a + (p ? p.mrp * i.qty : 0);
      }, 0);
    }
  };

  /* ---- toast ------------------------------------------------------------ */

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    $('#toast-msg').textContent = msg;
    el.setAttribute('data-open', 'true');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.setAttribute('data-open', 'false'); }, 3200);
  }

  /* ---- cards ------------------------------------------------------------ */

  function card(prod, index) {
    var cat = D.categoryOf(prod.cat);
    var wished = store.get('solah.wish', []).indexOf(prod.id) > -1;
    return '' +
      '<article class="card reveal" style="--d:' + Math.min(index || 0, 7) * 55 + 'ms">' +
        '<a class="card__media" href="product.html?id=' + prod.id + '" aria-label="' + esc(prod.name) + '">' +
          media(prod, '(max-width:700px) 46vw, 260px') +
        '</a>' +
        '<div class="card__badges">' +
          (prod.badge ? '<span class="tag tag--brass">' + esc(prod.badge) + '</span>' : '') +
          (prod.off >= 30 ? '<span class="tag tag--sale">' + prod.off + '% off</span>' : '') +
        '</div>' +
        '<button class="card__wish" type="button" aria-pressed="' + (wished ? 'true' : 'false') + '" ' +
          'data-wish="' + prod.id + '" aria-label="Save ' + esc(prod.name) + ' for later">' +
          '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20Z"/></svg>' +
        '</button>' +
        '<div class="card__body">' +
          '<span class="card__cat">' + esc(cat ? cat.name : prod.cat) + '</span>' +
          '<h3 class="card__name"><a href="product.html?id=' + prod.id + '">' + esc(prod.name) + '</a></h3>' +
          '<p class="card__price">' +
            '<span class="price">' + money(prod.price) + '</span>' +
            '<del>' + money(prod.mrp) + '</del>' +
            '<ins>' + prod.off + '% off</ins>' +
          '</p>' +
          (prod.price >= D.FREE_SHIP_OVER
            ? '<span class="card__ship">' +
                '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px"><path d="M4 7h11v10H4zM15 10h4l2 3v4h-6z"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>' +
                'Free delivery</span>'
            : '') +
          '<button class="btn btn--sm btn--block card__add" type="button" data-add="' + prod.id + '">Add to cart</button>' +
        '</div>' +
      '</article>';
  }

  function renderGrid(el, list) {
    if (!list.length) {
      el.innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        '<h3>Nothing matches those filters</h3>' +
        '<p>Try removing a filter, or browse everything we have.</p>' +
        '<button class="btn btn--ghost" type="button" data-clear-filters>Clear all filters</button></div>';
      return;
    }
    el.innerHTML = list.map(card).join('');
    observe(el);
  }

  /* ---- motion ----------------------------------------------------------- */

  var io;
  function observe(root) {
    if (!('IntersectionObserver' in global)) {
      $$('.reveal', root).forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    }
    $$('.reveal', root || document).forEach(function (n) {
      if (!n.classList.contains('is-in')) io.observe(n);
    });
  }

  /* ---- chrome (header, drawer, global handlers) ------------------------- */

  function chrome() {
    document.documentElement.classList.add('js');

    var drawer = $('#drawer'), scrim = $('#scrim');
    function setDrawer(open) {
      if (!drawer) return;
      drawer.setAttribute('data-open', String(open));
      scrim.setAttribute('data-open', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
      $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var f = $('a,button', drawer); if (f) f.focus(); }
    }
    $$('[data-drawer-open]').forEach(function (b) {
      b.addEventListener('click', function () { setDrawer(drawer.getAttribute('data-open') !== 'true'); });
    });
    $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { setDrawer(false); }); });
    if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

    /* Delegated: add-to-cart and wishlist work on any page. */
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        var p = D.byId(add.getAttribute('data-add'));
        if (!p) return;
        add.classList.add('is-loading');
        setTimeout(function () {
          add.classList.remove('is-loading');
          cart.add(p.id, 1);
          toast(p.name + ' added to cart');
        }, 260);
        return;
      }
      var wish = e.target.closest('[data-wish]');
      if (wish) {
        var id = wish.getAttribute('data-wish');
        var list = store.get('solah.wish', []);
        var i = list.indexOf(id);
        if (i > -1) list.splice(i, 1); else list.push(id);
        store.set('solah.wish', list);
        wish.setAttribute('aria-pressed', String(i === -1));
        toast(i === -1 ? 'Saved for later' : 'Removed from saved');
      }
    });

    cart.emit();
    observe(document);
  }

  /* ---- home ------------------------------------------------------------- */

  function home() {
    /* hero cluster */
    var cluster = $('#cluster');
    if (cluster) {
      ['e3', 'g1', 'w3'].forEach(function (id) {
        var p = D.byId(id);
        var fig = document.createElement('figure');
        fig.innerHTML = media(p) +
          '<figcaption><span>' + esc(p.name) + '</span><span class="num">' + money(p.price) + '</span></figcaption>';
        cluster.appendChild(fig);
      });
    }

    /* categories */
    var cats = $('#cats');
    if (cats) {
      cats.innerHTML = D.categories.slice(0, 8).map(function (c) {
        var sample = D.products.filter(function (p) { return p.cat === c.slug; })[0];
        return '<a href="shop.html?cat=' + c.slug + '" class="reveal">' +
          (sample ? Art.svg(sample.form, sample.metal, sample.stone, c.name) : '') +
          '<strong>' + esc(c.name) + ' <span class="deva" style="color:var(--brass);font-size:.8em">' + esc(c.deva) + '</span></strong>' +
          '<span>' + esc(c.blurb) + '</span></a>';
      }).join('');
    }

    /* occasion tabs — the multi-category "finish" made operable */
    var tabs = $('#occ-tabs'), out = $('#occ-grid');
    if (tabs && out) {
      var current = 'wedding';
      function paint() {
        $$('button', tabs).forEach(function (b) {
          b.setAttribute('aria-selected', String(b.dataset.occ === current));
        });
        var list = D.products.filter(function (p) { return p.occasion.indexOf(current) > -1; }).slice(0, 8);
        renderGrid(out, list);
        var occ = null;
        D.occasions.forEach(function (o) { if (o.slug === current) occ = o; });
        $('#occ-blurb').textContent = occ ? occ.blurb : '';
      }
      tabs.innerHTML = D.occasions.map(function (o) {
        return '<button class="tab" type="button" role="tab" data-occ="' + o.slug + '" ' +
               'aria-selected="' + (o.slug === current) + '">' + esc(o.name) + '</button>';
      }).join('');
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-occ]');
        if (!b) return;
        current = b.dataset.occ;
        paint();
      });
      paint();
    }

    /* bestsellers */
    var best = $('#best');
    if (best) {
      renderGrid(best, D.products.filter(function (p) { return p.off >= 28; }).slice(0, 8));
    }
  }

  /* ---- shop (PLP) ------------------------------------------------------- */

  function shop() {
    var grid = $('#shop-grid');
    if (!grid) return;

    var state = {
      cats: param('cat') ? [param('cat')] : [],
      occ: param('occ') ? [param('occ')] : [],
      price: [],
      sort: 'featured'
    };

    var catBox = $('#f-cat'), occBox = $('#f-occ'), priceBox = $('#f-price');

    catBox.innerHTML = D.categories.map(function (c) {
      var n = D.products.filter(function (p) { return p.cat === c.slug; }).length;
      return '<label class="check"><input type="checkbox" value="' + c.slug + '"' +
        (state.cats.indexOf(c.slug) > -1 ? ' checked' : '') + '> ' + esc(c.name) +
        ' <span style="color:var(--ink-3);font-variant-numeric:tabular-nums">(' + n + ')</span></label>';
    }).join('');

    occBox.innerHTML = D.occasions.map(function (o) {
      return '<label class="check"><input type="checkbox" value="' + o.slug + '"' +
        (state.occ.indexOf(o.slug) > -1 ? ' checked' : '') + '> ' + esc(o.name) + '</label>';
    }).join('');

    var BANDS = [
      { id: 'a', label: 'Under ₹1,000', test: function (p) { return p.price < 1000; } },
      { id: 'b', label: '₹1,000 – ₹2,499', test: function (p) { return p.price >= 1000 && p.price < 2500; } },
      { id: 'c', label: '₹2,500 – ₹3,999', test: function (p) { return p.price >= 2500 && p.price < 4000; } },
      { id: 'd', label: '₹4,000 and above', test: function (p) { return p.price >= 4000; } }
    ];
    priceBox.innerHTML = BANDS.map(function (b) {
      return '<label class="check"><input type="checkbox" value="' + b.id + '"> ' + b.label + '</label>';
    }).join('');

    function apply() {
      var list = D.products.filter(function (p) {
        if (state.cats.length && state.cats.indexOf(p.cat) === -1) return false;
        if (state.occ.length && !state.occ.some(function (o) { return p.occasion.indexOf(o) > -1; })) return false;
        if (state.price.length) {
          var ok = state.price.some(function (id) {
            var band = null;
            BANDS.forEach(function (b) { if (b.id === id) band = b; });
            return band && band.test(p);
          });
          if (!ok) return false;
        }
        return true;
      });

      if (state.sort === 'low') list.sort(function (a, b) { return a.price - b.price; });
      if (state.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
      if (state.sort === 'off') list.sort(function (a, b) { return b.off - a.off; });

      $('#shop-count').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
      renderGrid(grid, list);
    }

    function read() {
      state.cats = $$('#f-cat input:checked').map(function (i) { return i.value; });
      state.occ = $$('#f-occ input:checked').map(function (i) { return i.value; });
      state.price = $$('#f-price input:checked').map(function (i) { return i.value; });
      apply();
    }

    $('#filters').addEventListener('change', read);
    $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; apply(); });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-clear-filters]')) return;
      $$('#filters input:checked').forEach(function (i) { i.checked = false; });
      read();
    });

    var active = param('cat') ? D.categoryOf(param('cat')) : null;
    if (active) {
      $('#shop-title').textContent = active.name;
      $('#shop-blurb').textContent = active.blurb;
    }

    apply();
  }

  /* ---- product (PDP) ---------------------------------------------------- */

  function product() {
    var root = $('#pdp');
    if (!root) return;

    var prod = D.byId(param('id')) || D.products[0];
    var cat = D.categoryOf(prod.cat);
    document.title = prod.name + ' — SOLAH';
    document.body.classList.add('has-buybar');

    /* The gallery shows the piece in each metal it is sold in, so every
       thumbnail is a genuinely different thing to look at and the strip stays
       in sync with the metal swatches below it. */
    var METAL_KEYS = ['gold', 'silver', 'rose'];
    var chosenMetal = prod.metal;

    function paintGallery() {
      $('#gal-main').innerHTML = prod.image
        ? media(prod)
        : Art.svg(prod.form, chosenMetal, prod.stone,
                  prod.name + ' in ' + Art.metals[chosenMetal].name);
      $('#gal-thumbs').innerHTML = METAL_KEYS.map(function (k) {
        return '<button type="button" data-view="' + k + '" aria-current="' + (k === chosenMetal) + '" ' +
          'aria-label="View in ' + Art.metals[k].name + '">' +
          Art.svg(prod.form, k, prod.stone, Art.metals[k].name) + '</button>';
      }).join('');
      $$('#swatches .swatch').forEach(function (s) {
        s.setAttribute('aria-pressed', String(s.dataset.metal === chosenMetal));
      });
      $('#metal-name').textContent = Art.metals[chosenMetal].name;
    }

    $('#gal-thumbs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]');
      if (!b) return;
      chosenMetal = b.dataset.view;
      paintGallery();
    });

    $('#pdp-cat').textContent = cat ? cat.name : '';
    $('#pdp-crumb').textContent = prod.name;
    $('#pdp-name').textContent = prod.name;
    $('#pdp-price').innerHTML =
      '<span class="price">' + money(prod.price) + '</span>' +
      '<del>' + money(prod.mrp) + '</del>' +
      '<ins>' + prod.off + '% off</ins>';
    $('#pdp-desc').textContent = prod.desc;
    $('#bb-price').textContent = money(prod.price);

    $('#pdp-spec').innerHTML = [
      ['Material', prod.material],
      ['Stone', prod.stone_name],
      ['Weight', prod.weight],
      ['Warranty', prod.warranty],
      ['Care', prod.care],
      ['Country of origin', 'India']
    ].map(function (r) {
      return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
    }).join('');

    /* metal swatches — the same state the gallery reads */
    $('#swatches').innerHTML = METAL_KEYS.map(function (k) {
      var m = Art.metals[k];
      return '<button class="swatch" type="button" data-metal="' + k + '" aria-pressed="' + (k === chosenMetal) + '" ' +
        'aria-label="' + m.name + '"><span style="background:linear-gradient(135deg,' + m.a + ',' + m.b + ' 55%,' + m.c + ')"></span></button>';
    }).join('');
    $('#swatches').addEventListener('click', function (e) {
      var b = e.target.closest('[data-metal]');
      if (!b) return;
      chosenMetal = b.dataset.metal;
      paintGallery();
    });

    paintGallery();

    /* quantity */
    var qty = 1;
    $('#qty').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      qty = Math.max(1, Math.min(9, qty + (b.dataset.step === 'up' ? 1 : -1)));
      $('#qty-out').value = qty;
      $('#qty-down').disabled = qty === 1;
      $('#qty-up').disabled = qty === 9;
    });
    $('#qty-down').disabled = true;

    $$('[data-add-pdp]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cart.add(prod.id, qty);
        toast(prod.name + ' × ' + qty + ' added to cart');
      });
    });
    $('#buy-now').addEventListener('click', function () {
      cart.add(prod.id, qty);
      global.location.href = 'cart.html';
    });

    /* complete-the-finish cross-sell: the multi-category position, operable */
    var fin = $('#finish-grid');
    if (fin) {
      var picks = (prod.finishWith || []).map(D.byId).filter(Boolean);
      while (picks.length < 4) {
        var extra = D.products[Math.floor(Math.random() * D.products.length)];
        if (extra.id !== prod.id && picks.indexOf(extra) === -1) picks.push(extra);
      }
      renderGrid(fin, picks.slice(0, 4));
    }

    pincode();
  }

  /* ---- pincode ---------------------------------------------------------- */

  /* DEMO LOGIC. Delivery windows are derived from the pincode's first digit so
     the interaction is consistent and demonstrable. Wire this to your courier's
     serviceability API before launch — see HANDOFF.md. */
  function pincode() {
    var form = $('#pin-form');
    if (!form) return;
    var input = $('#pin'), out = $('#pin-out');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.replace(/\D/g, '');
      if (v.length !== 6) {
        input.setAttribute('aria-invalid', 'true');
        out.setAttribute('data-state', 'err');
        out.textContent = 'Enter a valid 6-digit pincode.';
        input.focus();
        return;
      }
      input.setAttribute('aria-invalid', 'false');

      var zone = parseInt(v[0], 10);
      var days = zone <= 1 ? 2 : zone <= 4 ? 3 : zone <= 6 ? 4 : 6;
      var codOk = zone !== 7;
      var when = new Date();
      when.setDate(when.getDate() + days);
      var pretty = when.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      out.setAttribute('data-state', 'ok');
      out.innerHTML = 'Delivers by <strong>' + pretty + '</strong> · ' +
        (codOk ? 'Cash on delivery available' : 'Prepaid orders only at this pincode');
    });
  }

  /* ---- cart page -------------------------------------------------------- */

  function cartPage() {
    var root = $('#cart-lines');
    if (!root) return;

    function paint() {
      if (!cart.items.length) {
        root.innerHTML = '<div class="empty"><h3>Your cart is empty</h3>' +
          '<p>Nothing here yet. Start with what people buy most.</p>' +
          '<a class="btn" href="shop.html">Browse everything</a></div>';
        $('#cart-side').hidden = true;
        return;
      }
      $('#cart-side').hidden = false;

      root.innerHTML = cart.items.map(function (it) {
        var p = D.byId(it.id);
        if (!p) return '';
        return '<div class="line">' +
          '<a class="line__media" href="product.html?id=' + p.id + '">' + media(p) + '</a>' +
          '<div>' +
            '<h4><a href="product.html?id=' + p.id + '" style="text-decoration:none">' + esc(p.name) + '</a></h4>' +
            '<p class="line__meta">' + esc(D.categoryOf(p.cat).name) + ' · ' + esc(Art.metals[p.metal].name) + '</p>' +
            '<p class="line__meta" style="margin-top:.35rem">' +
              (p.cod ? 'COD available' : 'Prepaid only') + '</p>' +
            '<button class="line__remove" type="button" data-remove="' + p.id + '">Remove</button>' +
          '</div>' +
          '<div class="line__right">' +
            '<span class="price" style="font-weight:600">' + money(p.price * it.qty) + '</span>' +
            '<span class="qty">' +
              '<button type="button" data-q="down" data-id="' + p.id + '" aria-label="Decrease quantity">−</button>' +
              '<output class="num">' + it.qty + '</output>' +
              '<button type="button" data-q="up" data-id="' + p.id + '" aria-label="Increase quantity">+</button>' +
            '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      totals();
    }

    function totals() {
      var sub = cart.subtotal();
      var mrp = cart.mrpTotal();
      var saved = mrp - sub;
      var prepaid = $('#pay-prepaid') && $('#pay-prepaid').checked;
      var ship = sub >= D.FREE_SHIP_OVER || sub === 0 ? 0 : 79;
      var codFee = prepaid ? 0 : (sub > 0 ? D.COD_FEE : 0);
      var discount = prepaid ? Math.round(sub * D.PREPAID_OFF / 100) : 0;
      var total = sub + ship + codFee - discount;

      $('#t-sub').textContent = money(sub);
      $('#t-saved').textContent = '− ' + money(saved);
      $('#t-ship').textContent = ship === 0 ? 'Free' : money(ship);
      $('#t-codrow').hidden = prepaid || sub === 0;
      $('#t-cod').textContent = money(codFee);
      $('#t-preprow').hidden = !prepaid || sub === 0;
      $('#t-prepaid').textContent = '− ' + money(discount);
      $('#t-total').textContent = money(total);

      /* free-shipping meter — the AOV lever, stated plainly */
      var pct = Math.min(100, Math.round(sub / D.FREE_SHIP_OVER * 100));
      $('#meter-fill').style.transform = 'scaleX(' + (pct / 100) + ')';
      $('#meter-fill').parentNode.setAttribute('aria-valuenow', String(pct));
      $('#meter-msg').innerHTML = sub >= D.FREE_SHIP_OVER
        ? 'Your order ships free.'
        : 'Add <strong>' + money(D.FREE_SHIP_OVER - sub) + '</strong> more for free delivery.';
    }

    root.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-remove]');
      if (rm) { cart.remove(rm.dataset.remove); paint(); toast('Removed from cart'); return; }
      var q = e.target.closest('[data-q]');
      if (q) {
        var item = null;
        cart.items.forEach(function (i) { if (i.id === q.dataset.id) item = i; });
        if (!item) return;
        cart.setQty(item.id, item.qty + (q.dataset.q === 'up' ? 1 : -1));
        paint();
      }
    });

    $$('input[name=pay]').forEach(function (r) { r.addEventListener('change', totals); });

    $('#place').addEventListener('click', function () {
      var b = $('#place');
      b.classList.add('is-loading');
      setTimeout(function () {
        b.classList.remove('is-loading');
        $('#checkout-note').hidden = false;
        $('#checkout-note').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 700);
    });

    paint();
  }

  /* ---- newsletter ------------------------------------------------------- */

  function news() {
    var f = $('#news-form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#news-email');
      if (!input.value || input.value.indexOf('@') === -1) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.setAttribute('aria-invalid', 'false');
      f.hidden = true;
      $('#news-ok').hidden = false;
    });
  }

  /* ---- boot ------------------------------------------------------------- */

  function boot() {
    chrome();
    home();
    shop();
    product();
    cartPage();
    news();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.Solah = { cart: cart, money: money, card: card, media: media };
})(window);
