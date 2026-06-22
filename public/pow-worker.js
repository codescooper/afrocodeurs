// Web Worker — résolution de la preuve de travail (Hashcash).
// Tourne hors du thread principal : l'interface ne gèle jamais pendant le calcul.
// SHA-256 pur (FIPS 180-4) pour produire le MÊME condensat que `node:crypto`
// côté serveur (cf. lib/pow.ts). Aucune dépendance, aucun bundler.

(function () {
  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function ror(x, n) {
    return (x >>> n) | (x << (32 - n));
  }

  // SHA-256 d'un Uint8Array → Uint8Array(32).
  function sha256(bytes) {
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    var l = bytes.length;
    var bitLen = l * 8;
    var withOne = l + 1;
    var pad = ((56 - (withOne % 64)) + 64) % 64;
    var total = withOne + pad + 8;
    var m = new Uint8Array(total);
    m.set(bytes);
    m[l] = 0x80;
    var dv = new DataView(m.buffer);
    dv.setUint32(total - 4, bitLen >>> 0, false);
    dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);

    var w = new Uint32Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
      for (var i = 16; i < 64; i++) {
        var s0 = ror(w[i - 15], 7) ^ ror(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = ror(w[i - 2], 17) ^ ror(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (var i = 0; i < 64; i++) {
        var S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        var S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    var out = new Uint8Array(32);
    var odv = new DataView(out.buffer);
    var hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (var i = 0; i < 8; i++) odv.setUint32(i * 4, hs[i] >>> 0, false);
    return out;
  }

  function toHex(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) {
      s += (bytes[i] >>> 4).toString(16) + (bytes[i] & 0x0f).toString(16);
    }
    return s;
  }

  function leadingZeroBits(bytes) {
    var bits = 0;
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if (b === 0) {
        bits += 8;
        continue;
      }
      bits += Math.clz32(b) - 24;
      break;
    }
    return bits;
  }

  // Cherche le plus petit nonce tel que SHA-256("challenge:nonce") ait
  // >= difficulty bits de zéro en tête. onProgress(attempts) périodiquement.
  function solve(challenge, difficulty, onProgress) {
    var enc = new TextEncoder();
    for (var nonce = 0; ; nonce++) {
      var digest = sha256(enc.encode(challenge + ":" + nonce));
      if (leadingZeroBits(digest) >= difficulty) return nonce;
      if (onProgress && (nonce & 0x3fff) === 0) onProgress(nonce);
    }
  }

  // Exposé pour les tests (chargé hors worker) ; sinon, branche le worker.
  if (typeof self !== "undefined") {
    self.__pow = { sha256: sha256, leadingZeroBits: leadingZeroBits, solve: solve };
    if (typeof self.postMessage === "function") {
      self.onmessage = function (event) {
        var data = event && event.data ? event.data : {};
        if (!data.challenge) return;
        var nonce = solve(data.challenge, data.difficulty, function (attempts) {
          self.postMessage({ type: "progress", attempts: attempts });
        });
        var hash = toHex(sha256(new TextEncoder().encode(data.challenge + ":" + nonce)));
        self.postMessage({ type: "found", nonce: nonce, hash: hash });
      };
    }
  }
})();
