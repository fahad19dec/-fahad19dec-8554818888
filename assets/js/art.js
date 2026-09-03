/* SOLAH — product art
 *
 * Hand-authored SVG renderings, one per accessory type, parameterised by metal
 * and stone colour. These are deliberate illustrations, never photo mimicry.
 *
 * Every rendering is drawn into a 4:5 portrait frame, the standard ecommerce
 * product ratio, so a real photograph dropped into the same slot needs no
 * layout change. See HANDOFF.md, "Swapping in real photography".
 */
(function (global) {
  'use strict';

  var METALS = {
    gold:  { a: '#F1DCA6', b: '#C9A24B', c: '#8A6520', name: 'Gold' },
    silver:{ a: '#F2F3F4', b: '#C3C7CC', c: '#83898F', name: 'Silver' },
    rose:  { a: '#F6D9CE', b: '#D5A08C', c: '#9C6A57', name: 'Rose gold' }
  };

  function uid() {
    return 's' + Math.random().toString(36).slice(2, 9);
  }

  /* Metal gradient + gem gradient defs, scoped per instance so multiple
     renderings on one page never collide on gradient ids. */
  function defs(id, metal, stone) {
    var m = METALS[metal] || METALS.gold;
    return (
      '<defs>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="' + m.a + '"/>' +
        '<stop offset="42%" stop-color="' + m.b + '"/>' +
        '<stop offset="72%" stop-color="' + m.c + '"/>' +
        '<stop offset="100%" stop-color="' + m.b + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + id + 'e" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + m.a + '"/>' +
        '<stop offset="100%" stop-color="' + m.c + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + id + 'g" cx="34%" cy="28%" r="78%">' +
        '<stop offset="0%" stop-color="#FFFFFF" stop-opacity=".85"/>' +
        '<stop offset="34%" stop-color="' + stone + '"/>' +
        '<stop offset="100%" stop-color="' + shade(stone, -38) + '"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="' + tint(stone, 16) + '"/>' +
        '<stop offset="55%" stop-color="' + stone + '"/>' +
        '<stop offset="100%" stop-color="' + shade(stone, -26) + '"/>' +
      '</linearGradient>' +
      '<filter id="' + id + 'sh" x="-30%" y="-30%" width="160%" height="160%">' +
        '<feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#1B1815" flood-opacity=".17"/>' +
      '</filter>' +
      '</defs>'
    );
  }

  function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }

  function parse(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function toHex(rgb) {
    return '#' + rgb.map(function (v) {
      var s = clamp(v).toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }

  function shade(hex, amt) {
    var c = parse(hex);
    return toHex([c[0] + amt, c[1] + amt, c[2] + amt]);
  }

  function tint(hex, amt) { return shade(hex, amt); }

  /* ---- individual pieces -------------------------------------------------
     Each returns the inner markup for a 400x500 viewBox. One entry per PRODUCT
     FORM, not per category: a huggie hoop must not be drawn as a drop, and a
     plain band must not be drawn with a stone. A picture that contradicts the
     product name is the exact trust failure this store is built to avoid. */

  var PIECES = {

    /* --- earrings --- */

    'drop': function (id) {
      function one(cx) {
        return '<circle cx="' + cx + '" cy="168" r="9" fill="url(#' + id + 'm)"/>' +
          '<circle cx="' + (cx - 2) + '" cy="165" r="3.4" fill="#FFF" opacity=".6"/>' +
          '<path d="M' + cx + ' 177 v34" stroke="url(#' + id + 'e)" stroke-width="3.4" stroke-linecap="round"/>' +
          '<path d="M' + cx + ' 211 l30 34 -30 62 -30 -62 z" fill="url(#' + id + 'g)"/>' +
          '<path d="M' + cx + ' 211 l30 34 -30 20 -30 -20 z" fill="#FFF" opacity=".26"/>' +
          '<path d="M' + cx + ' 211 l30 34 -30 62 -30 -62 z" fill="none" stroke="url(#' + id + 'e)" stroke-width="3"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + one(138) + one(262) + '</g>';
    },

    'hoop': function (id) {
      function one(cx) {
        return '<circle cx="' + cx + '" cy="250" r="52" fill="none" stroke="url(#' + id + 'm)" stroke-width="15"/>' +
          '<circle cx="' + cx + '" cy="250" r="52" fill="none" stroke="#FFF" stroke-width="3" opacity=".32"/>' +
          '<circle cx="' + cx + '" cy="198" r="8.5" fill="url(#' + id + 'e)"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + one(132) + one(268) + '</g>';
    },

    'jhumka': function (id, stone) {
      function one(cx) {
        var s = '<circle cx="' + cx + '" cy="150" r="8.5" fill="url(#' + id + 'm)"/>' +
          '<path d="M' + cx + ' 158 v26" stroke="url(#' + id + 'e)" stroke-width="3.2" stroke-linecap="round"/>' +
          '<circle cx="' + cx + '" cy="196" r="15" fill="url(#' + id + 'g)" stroke="url(#' + id + 'e)" stroke-width="2.5"/>' +
          /* the dome */
          '<path d="M' + (cx - 62) + ' 292 a62 62 0 0 1 124 0 z" fill="url(#' + id + 'm)"/>' +
          '<path d="M' + (cx - 62) + ' 292 a62 62 0 0 1 124 0 z" fill="none" stroke="' + shade(stone, -40) + '" stroke-width="1" opacity=".4"/>' +
          '<path d="M' + (cx - 40) + ' 268 a40 40 0 0 1 80 0" fill="none" stroke="#FFF" stroke-width="2.5" opacity=".35"/>' +
          '<circle cx="' + cx + '" cy="258" r="11" fill="url(#' + id + 'g)"/>' +
          '<rect x="' + (cx - 66) + '" y="290" width="132" height="9" rx="4" fill="url(#' + id + 'e)"/>';
        /* pearl fringe */
        for (var k = -5; k <= 5; k++) {
          var px = cx + k * 12, py = 300 + Math.round(Math.abs(k) * Math.abs(k) * 0.9);
          s += '<path d="M' + px + ' 299 v' + (py - 299 + 10) + '" stroke="url(#' + id + 'e)" stroke-width="1.6"/>' +
               '<circle cx="' + px + '" cy="' + (py + 16) + '" r="6" fill="#F3EDE2" stroke="' + shade(stone, -30) + '" stroke-opacity=".25"/>' +
               '<circle cx="' + (px - 2) + '" cy="' + (py + 13) + '" r="2" fill="#FFF"/>';
        }
        return s;
      }
      return '<g filter="url(#' + id + 'sh)">' + one(120) + one(280) + '</g>';
    },

    /* --- necklaces --- */

    'chain': function (id) {
      var s = '<path d="M108 148 C108 272 150 330 200 330 C250 330 292 272 292 148" ' +
        'fill="none" stroke="url(#' + id + 'm)" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M108 148 C108 272 150 330 200 330 C250 330 292 272 292 148" ' +
        'fill="none" stroke="#FFF" stroke-width="2.2" opacity=".4" stroke-linecap="round"/>';
      /* rope twist marks along the curve */
      for (var k = 0; k < 13; k++) {
        var t = k / 12, a = Math.PI * (0.15 + t * 0.7);
        var x = 200 - Math.cos(a) * 92, y = 158 + Math.sin(a) * 168;
        s += '<circle cx="' + Math.round(x) + '" cy="' + Math.round(y) + '" r="2.6" fill="#FFF" opacity=".3"/>';
      }
      s += '<circle cx="108" cy="148" r="7" fill="url(#' + id + 'm)"/>' +
           '<circle cx="292" cy="148" r="7" fill="url(#' + id + 'm)"/>';
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    },

    'pendant-coin': function (id, stone) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<path d="M110 146 C110 250 148 300 200 300 C252 300 290 250 290 146" ' +
          'fill="none" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '<circle cx="110" cy="146" r="6.5" fill="url(#' + id + 'm)"/>' +
        '<circle cx="290" cy="146" r="6.5" fill="url(#' + id + 'm)"/>' +
        '<circle cx="200" cy="306" r="9" fill="none" stroke="url(#' + id + 'e)" stroke-width="3.4"/>' +
        '<circle cx="200" cy="366" r="52" fill="url(#' + id + 'm)"/>' +
        '<circle cx="200" cy="366" r="52" fill="none" stroke="' + shade(stone, -46) + '" stroke-width="1" opacity=".35"/>' +
        '<circle cx="200" cy="366" r="40" fill="none" stroke="' + shade(stone, -30) + '" stroke-width="2" opacity=".45"/>' +
        '<circle cx="200" cy="366" r="17" fill="url(#' + id + 'g)"/>' +
        /* temple-coin rays */
        '<g stroke="' + shade(stone, -34) + '" stroke-width="2" opacity=".55">' +
          '<path d="M200 332 v9M200 391 v9M166 366 h9M225 366 h9M176 342 l6 6M218 384 l6 6M224 342 l-6 6M182 384 l-6 6"/>' +
        '</g></g>';
    },

    'pendant-line': function (id) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<path d="M116 152 C116 258 152 306 200 306 C248 306 284 258 284 152" ' +
          'fill="none" stroke="url(#' + id + 'm)" stroke-width="4.5" stroke-linecap="round"/>' +
        '<circle cx="116" cy="152" r="5.5" fill="url(#' + id + 'm)"/>' +
        '<circle cx="284" cy="152" r="5.5" fill="url(#' + id + 'm)"/>' +
        '<rect x="184" y="306" width="32" height="52" rx="4" fill="url(#' + id + 'g)" ' +
          'stroke="url(#' + id + 'e)" stroke-width="3"/>' +
        '<path d="M188 314 h24" stroke="#FFF" stroke-width="3" opacity=".38"/>' +
        '</g>';
    },

    /* --- rings --- */

    'band': function (id) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<ellipse cx="200" cy="272" rx="82" ry="86" fill="none" stroke="url(#' + id + 'm)" stroke-width="20"/>' +
        '<ellipse cx="200" cy="272" rx="82" ry="86" fill="none" stroke="#FFF" stroke-width="3" opacity=".34"/>' +
        '<ellipse cx="200" cy="272" rx="82" ry="86" fill="none" stroke="' + '#00000022' + '" stroke-width="1"/>' +
        '<ellipse cx="200" cy="272" rx="64" ry="68" fill="var(--surface, #FFF)"/>' +
        '</g>';
    },

    'solitaire': function (id) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<ellipse cx="200" cy="300" rx="76" ry="80" fill="none" stroke="url(#' + id + 'm)" stroke-width="15"/>' +
        '<ellipse cx="200" cy="300" rx="76" ry="80" fill="none" stroke="#FFF" stroke-width="2.4" opacity=".34"/>' +
        '<ellipse cx="200" cy="300" rx="62" ry="66" fill="#FFF"/>' +
        '<g transform="translate(200 200)">' +
          '<path d="M0 -42 l32 28 -32 48 -32 -48 z" fill="url(#' + id + 'g)"/>' +
          '<path d="M0 -42 l32 28 -32 15 -32 -15 z" fill="#FFF" opacity=".32"/>' +
          '<path d="M0 -42 l32 28 -32 48 -32 -48 z" fill="none" stroke="url(#' + id + 'e)" stroke-width="3"/>' +
          '<path d="M-32 -14 h64" stroke="url(#' + id + 'e)" stroke-width="2.4" opacity=".8"/>' +
        '</g></g>';
    },

    'signet': function (id, stone) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<ellipse cx="200" cy="312" rx="74" ry="78" fill="none" stroke="url(#' + id + 'm)" stroke-width="17"/>' +
        '<ellipse cx="200" cy="312" rx="74" ry="78" fill="none" stroke="#FFF" stroke-width="2.4" opacity=".3"/>' +
        '<ellipse cx="200" cy="312" rx="60" ry="64" fill="#FFF"/>' +
        '<rect x="142" y="168" width="116" height="80" rx="14" fill="url(#' + id + 'm)"/>' +
        '<rect x="142" y="168" width="116" height="26" rx="12" fill="#FFF" opacity=".22"/>' +
        '<rect x="164" y="188" width="72" height="42" rx="8" fill="url(#' + id + 'g)"/>' +
        '<rect x="164" y="188" width="72" height="14" rx="7" fill="#FFF" opacity=".24"/>' +
        '</g>';
    },

    /* --- bags --- */

    'tote': function (id, stone) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<path d="M150 200 v-22 a50 50 0 0 1 100 0 v22" fill="none" stroke="url(#' + id + 'm)" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M96 200 h208 l-14 176 a18 18 0 0 1 -18 16 h-144 a18 18 0 0 1 -18 -16 z" fill="url(#' + id + 'f)"/>' +
        '<path d="M96 200 h208 l-3 40 h-202 z" fill="#FFF" opacity=".13"/>' +
        '<rect x="176" y="252" width="48" height="34" rx="5" fill="url(#' + id + 'm)"/>' +
        '<rect x="186" y="266" width="28" height="4" rx="2" fill="' + shade(stone, -52) + '" opacity=".5"/>' +
        '</g>';
    },

    'sling': function (id, stone) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<path d="M112 214 L96 130 h18 l14 84" fill="url(#' + id + 'e)" opacity=".9"/>' +
        '<path d="M288 214 L304 130 h-18 l-14 84" fill="url(#' + id + 'e)" opacity=".9"/>' +
        '<path d="M120 214 h160 a16 16 0 0 1 16 16 v104 a16 16 0 0 1 -16 16 h-160 a16 16 0 0 1 -16 -16 v-104 a16 16 0 0 1 16 -16 z" fill="url(#' + id + 'f)"/>' +
        '<path d="M104 246 h192" stroke="#FFF" stroke-width="2" opacity=".2"/>' +
        '<path d="M120 214 h160 a16 16 0 0 1 16 16 v14 h-192 v-14 a16 16 0 0 1 16 -16 z" fill="#FFF" opacity=".12"/>' +
        '<rect x="182" y="262" width="36" height="26" rx="5" fill="url(#' + id + 'm)"/>' +
        '<path d="M188 275 h24" stroke="' + shade(stone, -50) + '" stroke-width="3" opacity=".45"/>' +
        '</g>';
    },

    'potli': function (id, stone) {
      var s = '<path d="M126 208 C160 176 240 176 274 208" fill="none" stroke="url(#' + id + 'm)" stroke-width="6"/>' +
        '<path d="M200 356 m-86 -76 a86 82 0 1 0 172 0 c0 -34 -30 -60 -86 -60 s-86 26 -86 60 z" fill="url(#' + id + 'f)"/>' +
        '<path d="M114 288 c0 -34 30 -68 86 -68 s86 34 86 68 c0 8 -172 8 -172 0 z" fill="#FFF" opacity=".12"/>';
      /* gathered top */
      for (var k = 0; k < 9; k++) {
        var x = 126 + k * 18.5;
        s += '<path d="M' + Math.round(x) + ' 224 q6 26 0 52" fill="none" stroke="' + shade(stone, -34) + '" stroke-width="2" opacity=".35"/>';
      }
      s += '<rect x="126" y="212" width="148" height="16" rx="8" fill="url(#' + id + 'm)"/>' +
           '<circle cx="200" cy="220" r="9" fill="url(#' + id + 'g)"/>';
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    },

    /* --- sunglasses --- */

    'square': function (id) {
      function lens(x) {
        return '<rect x="' + x + '" y="212" width="106" height="82" rx="14" fill="url(#' + id + 'f)" opacity=".92"/>' +
          '<path d="M' + (x + 6) + ' 224 h94 v18 h-94 z" fill="#FFF" opacity=".3"/>' +
          '<rect x="' + x + '" y="212" width="106" height="82" rx="14" fill="none" stroke="url(#' + id + 'm)" stroke-width="7"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + lens(88) + lens(206) +
        '<path d="M194 234 q6 -8 12 0" fill="none" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M88 226 L44 248" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M312 226 L356 248" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '</g>';
    },

    /* Cat-eye: the defining feature is the upswept OUTER corner. Left lens
       sweeps up-left, right lens up-right; both drop to a soft inner curve. */
    'cateye': function (id) {
      function lens(x, dir) {
        // dir -1 = left lens (tail on the left), +1 = right lens
        var tipX = dir < 0 ? x - 8 : x + 116;
        var d = dir < 0
          ? 'M' + tipX + ' 202 q34 4 52 20 q22 20 12 42 q-10 22 -42 24 q-34 2 -50 -20 q-14 -20 4 -44 q10 -16 24 -22 z'
          : 'M' + tipX + ' 202 q-34 4 -52 20 q-22 20 -12 42 q10 22 42 24 q34 2 50 -20 q14 -20 -4 -44 q-10 -16 -24 -22 z';
        return '<path d="' + d + '" fill="url(#' + id + 'f)" opacity=".92"/>' +
          '<path d="' + d + '" fill="none" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linejoin="round"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + lens(96, -1) + lens(188, 1) +
        '<path d="M186 232 q14 -10 28 0" fill="none" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M88 210 L44 232" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M312 210 L356 232" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linecap="round"/>' +
        '</g>';
    },

    /* Aviator: teardrop lenses, a double brow bar and a saddle bridge — the
       three things that make the shape read as an aviator at all. */
    'aviator': function (id) {
      function lens(x) {
        var d = 'M' + x + ' 220 h100 q4 34 -14 60 q-14 20 -36 20 q-22 0 -34 -22 q-16 -28 -16 -58 z';
        return '<path d="' + d + '" fill="url(#' + id + 'f)" opacity=".92"/>' +
          '<path d="M' + (x + 6) + ' 230 h86 q1 12 -2 20 h-82 q-2 -10 -2 -20 z" fill="#FFF" opacity=".34"/>' +
          '<path d="' + d + '" fill="none" stroke="url(#' + id + 'm)" stroke-width="6" stroke-linejoin="round"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + lens(84) + lens(216) +
        /* saddle bridge */
        '<path d="M184 226 q16 -12 32 0" fill="none" stroke="url(#' + id + 'm)" stroke-width="5" stroke-linecap="round"/>' +
        /* double brow bar */
        '<path d="M84 220 h232" stroke="url(#' + id + 'm)" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M148 208 h104" stroke="url(#' + id + 'm)" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M84 222 L40 240" stroke="url(#' + id + 'm)" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M316 222 L360 240" stroke="url(#' + id + 'm)" stroke-width="6" stroke-linecap="round"/>' +
        '</g>';
    },

    /* --- watches --- */

    function_placeholder: null,

    'watch-mesh': function (id, stone) {
      var s = '';
      for (var r = 0; r < 7; r++) {
        s += '<path d="M172 ' + (108 + r * 11) + ' h56" stroke="url(#' + id + 'e)" stroke-width="7" opacity="' + (0.55 + r * 0.05) + '"/>';
        s += '<path d="M172 ' + (392 + r * 11) + ' h56" stroke="url(#' + id + 'e)" stroke-width="7" opacity="' + (0.9 - r * 0.05) + '"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + s + dial(id, stone, 84) + '</g>';
    },

    'watch-leather': function (id, stone) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<path d="M170 104 h60 l-5 84 h-50 z" fill="' + shade(stone, -18) + '"/>' +
        '<path d="M175 396 h50 l5 82 h-60 z" fill="' + shade(stone, -18) + '"/>' +
        '<path d="M178 116 v64 M222 116 v64 M182 408 v58 M218 408 v58" stroke="#FFF" stroke-width="1.5" ' +
          'stroke-dasharray="5 5" opacity=".35"/>' +
        dial(id, stone, 88) + '</g>';
    },

    'watch-bracelet': function (id, stone) {
      var s = '';
      for (var r = 0; r < 5; r++) {
        s += '<rect x="166" y="' + (104 + r * 17) + '" width="68" height="13" rx="5" fill="url(#' + id + 'm)"/>';
        s += '<rect x="166" y="' + (396 + r * 17) + '" width="68" height="13" rx="5" fill="url(#' + id + 'm)"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + s + dial(id, stone, 92) + '</g>';
    },

    /* --- hair --- */

    'scrunchie': function (id, stone) {
      var s = '<ellipse cx="200" cy="286" rx="100" ry="88" fill="none" stroke="url(#' + id + 'f)" stroke-width="46"/>';
      for (var k = 0; k < 16; k++) {
        var a = (k / 16) * Math.PI * 2;
        var x1 = 200 + Math.cos(a) * 80, y1 = 286 + Math.sin(a) * 68;
        var x2 = 200 + Math.cos(a) * 120, y2 = 286 + Math.sin(a) * 108;
        s += '<path d="M' + Math.round(x1) + ' ' + Math.round(y1) + ' L' + Math.round(x2) + ' ' + Math.round(y2) +
             '" stroke="#FFF" stroke-width="2.5" opacity=".26"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    },

    'claw': function (id, stone) {
      var s = '<path d="M132 166 a92 118 0 0 1 136 0 l0 32 a70 92 0 0 0 -136 0 z" fill="url(#' + id + 'f)"/>' +
        '<path d="M132 380 a92 118 0 0 0 136 0 l0 -32 a70 92 0 0 1 -136 0 z" fill="url(#' + id + 'f)"/>' +
        '<path d="M132 198 a70 92 0 0 1 136 0" fill="none" stroke="#FFF" stroke-width="3" opacity=".22"/>';
      for (var k = 0; k < 5; k++) {
        var x = 148 + k * 26;
        s += '<path d="M' + x + ' 214 l10 34 -10 12 -10 -12 z" fill="' + shade(stone, -22) + '"/>';
        s += '<path d="M' + (x + 13) + ' 332 l10 -34 -10 -12 -10 12 z" fill="' + shade(stone, -22) + '"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    },

    'pins': function (id) {
      var s = '';
      for (var k = 0; k < 3; k++) {
        var x = 128 + k * 72;
        s += '<path d="M' + x + ' 190 v150" stroke="url(#' + id + 'm)" stroke-width="6" stroke-linecap="round"/>' +
             '<path d="M' + (x + 11) + ' 196 v128 a11 11 0 0 1 -22 0" fill="none" stroke="url(#' + id + 'e)" stroke-width="4"/>' +
             '<circle cx="' + x + '" cy="180" r="17" fill="#F3EDE2" stroke="' + '#00000018' + '"/>' +
             '<circle cx="' + (x - 5) + '" cy="174" r="5" fill="#FFF"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    },

    /* --- scarves --- */

    /* A square scarf reads as a square: flat edges, a hand-rolled hem border
       and a mitred corner motif, not a rounded blob. */
    'silk-square': function (id, stone) {
      return '<g filter="url(#' + id + 'sh)">' +
        '<rect x="106" y="156" width="188" height="188" fill="url(#' + id + 'f)"/>' +
        '<rect x="106" y="156" width="188" height="52" fill="#FFF" opacity=".14"/>' +
        /* hand-rolled hem */
        '<rect x="106" y="156" width="188" height="188" fill="none" ' +
          'stroke="' + shade(stone, -30) + '" stroke-width="7"/>' +
        '<rect x="120" y="170" width="160" height="160" fill="none" stroke="#FFF" stroke-width="2" opacity=".42"/>' +
        /* mitred corner motif */
        '<path d="M120 170 L160 170 L120 210 z M280 170 L240 170 L280 210 z ' +
          'M120 330 L160 330 L120 290 z M280 330 L240 330 L280 290 z" fill="#FFF" opacity=".2"/>' +
        '<rect x="164" y="214" width="72" height="72" fill="none" stroke="#FFF" stroke-width="2.5" opacity=".38"/>' +
        '<circle cx="200" cy="250" r="16" fill="#FFF" opacity=".22"/>' +
        '</g>';
    },

    'stole': function (id, stone) {
      var s = '<path d="M140 130 h120 v250 q-60 30 -120 0 z" fill="url(#' + id + 'f)"/>' +
        '<path d="M140 130 h120 v40 q-60 26 -120 0 z" fill="#FFF" opacity=".14"/>';
      for (var k = 0; k < 6; k++) {
        s += '<path d="M' + (152 + k * 20) + ' 150 v226" stroke="#FFF" stroke-width="1.5" opacity=".2"/>';
      }
      s += '<path d="M140 380 q60 30 120 0 v14 q-60 30 -120 0 z" fill="' + shade(stone, -26) + '"/>';
      for (var j = 0; j < 9; j++) {
        s += '<path d="M' + (146 + j * 14) + ' 396 v26" stroke="' + shade(stone, -20) + '" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>';
      }
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    },

    /* "Printed Chiffon Dupatta" — so it carries an actual repeating print,
       clipped to the drape, plus the stitched sequin edge. */
    'dupatta': function (id, stone) {
      var body = 'M104 148 q96 -22 192 0 v190 q-96 40 -192 0 z';
      var s = '<clipPath id="' + id + 'c"><path d="' + body + '"/></clipPath>' +
        '<path d="' + body + '" fill="url(#' + id + 'f)" opacity=".93"/>' +
        '<g clip-path="url(#' + id + 'c)" opacity=".5">';
      /* a butti print: small four-petal motifs on a staggered grid */
      for (var r = 0; r < 6; r++) {
        for (var c = 0; c < 6; c++) {
          var x = 108 + c * 34 + (r % 2 ? 17 : 0);
          var y = 172 + r * 30;
          s += '<path d="M' + x + ' ' + (y - 7) + ' q7 7 0 14 q-7 -7 -14 0 q7 -7 0 -14 q7 7 14 0 z" ' +
               'fill="#FFF" opacity=".55"/>' +
               '<circle cx="' + x + '" cy="' + y + '" r="2" fill="' + shade(stone, -34) + '"/>';
        }
      }
      s += '</g>' +
        '<path d="M104 148 q96 -22 192 0 v34 q-96 30 -192 0 z" fill="#FFF" opacity=".16"/>';
      for (var k = 0; k < 11; k++) {
        s += '<circle cx="' + (112 + k * 18) + '" cy="' + (338 + (k % 2 ? 6 : 0)) + '" r="5" fill="url(#' + id + 'm)"/>';
      }
      s += '<path d="M104 330 q96 40 192 0" fill="none" stroke="url(#' + id + 'm)" stroke-width="4" opacity=".85"/>';
      return '<g filter="url(#' + id + 'sh)">' + s + '</g>';
    }
  };

  delete PIECES.function_placeholder;

  /* Shared watch dial, so the three watch forms differ only where they should:
     in the strap. */
  function dial(id, stone, r) {
    return '<circle cx="200" cy="290" r="' + (r + 10) + '" fill="url(#' + id + 'm)"/>' +
      '<circle cx="200" cy="290" r="' + r + '" fill="url(#' + id + 'f)"/>' +
      '<circle cx="200" cy="290" r="' + r + '" fill="none" stroke="' + shade(stone, -46) + '" stroke-width="1.5" opacity=".45"/>' +
      '<circle cx="200" cy="290" r="' + (r - 16) + '" fill="none" stroke="#FFF" stroke-width="1" opacity=".2"/>' +
      '<path d="M200 ' + (290 - r + 8) + ' v10 M' + (200 + r - 8) + ' 290 h-10 M200 ' + (290 + r - 8) + ' v-10 M' + (200 - r + 8) + ' 290 h10" ' +
        'stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M200 290 V' + (290 - r + 26) + '" stroke="#FFF" stroke-width="4" stroke-linecap="round" opacity=".92"/>' +
      '<path d="M200 290 L' + (200 + Math.round(r * 0.42)) + ' 312" stroke="#FFF" stroke-width="3.4" stroke-linecap="round" opacity=".92"/>' +
      '<circle cx="200" cy="290" r="5" fill="url(#' + id + 'm)"/>' +
      '<rect x="' + (200 + r + 8) + '" y="278" width="11" height="24" rx="4" fill="url(#' + id + 'm)"/>';
  }

  /* Category → representative form, for tiles and any product missing a form. */
  var CATEGORY_FORM = {
    earrings: 'drop', necklaces: 'chain', rings: 'solitaire', bags: 'tote',
    sunglasses: 'square', watches: 'watch-mesh', hair: 'scrunchie', scarves: 'silk-square'
  };

  /* Renders a piece as an SVG string. `form` names the actual product shape;
     a category slug is accepted and resolved to that category's default. */
  function svg(form, metal, stone, label) {
    var id = uid();
    var piece = PIECES[form] || PIECES[CATEGORY_FORM[form]] || PIECES.drop;
    return (
      '<svg class="art" viewBox="0 0 400 500" role="img" aria-label="' +
        String(label || 'Product illustration').replace(/"/g, '&quot;') +
        '" xmlns="http://www.w3.org/2000/svg">' +
      defs(id, metal, stone) +
      piece(id, stone) +
      '</svg>'
    );
  }

  global.SolahArt = { svg: svg, metals: METALS, categoryForm: CATEGORY_FORM };
})(window);
