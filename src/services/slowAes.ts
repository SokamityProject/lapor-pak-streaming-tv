/**
 * Standalone slowAES decrypt implementation matching InfinityFree / ByetHost
 * anti-bot challenge (AES-128-CBC unpadded).
 */

const slowAES = {
  sbox: [
    99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,
    202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,
    183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,
    4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,
    9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,
    83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,
    208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,
    81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,
    205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,
    96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,
    224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,
    231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,
    186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,
    112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,
    225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,
    140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22
  ],
  rsbox: [
    82,9,106,213,48,54,165,56,191,64,163,158,129,243,215,251,
    124,227,57,130,155,47,255,135,52,142,67,68,196,222,233,203,
    84,123,148,50,166,194,35,61,238,76,149,11,66,250,195,78,
    8,46,161,102,40,217,36,178,118,91,162,73,109,139,209,37,
    114,248,246,100,134,104,152,22,212,164,92,204,93,101,182,146,
    108,112,72,80,253,237,185,218,94,21,70,87,167,141,157,132,
    144,216,171,0,140,188,211,10,247,228,88,5,184,179,69,6,
    208,44,30,143,202,63,15,2,193,175,189,3,1,19,138,107,
    58,145,17,65,79,103,220,234,151,242,207,206,240,180,230,115,
    150,172,116,34,231,173,53,133,226,249,55,232,28,117,223,110,
    71,241,26,113,29,41,197,137,111,183,98,14,170,24,190,27,
    252,86,62,75,198,210,121,32,154,219,192,254,120,205,90,244,
    31,221,168,51,136,7,199,49,177,18,16,89,39,128,236,95,96,
    81,127,169,25,181,74,13,45,229,122,159,147,201,156,239,160,
    224,59,77,174,42,245,176,200,235,187,60,131,83,153,97,23,
    43,4,126,186,119,214,38,225,105,20,99,85,33,12,125
  ],
  Rcon: [
    141,1,2,4,8,16,32,64,128,27,54,108,216,171,77,154,47,94,188,99,198,151,53,106,212,179,125,250,239,197,145,57,114,228,211,189,97,194,159,37,74,148,51,102,204,131,29,58,116,232,203
  ],
  rotate: function(i: number[]): number[] {
    const t = i[0];
    for (let r = 0; r < 3; r++) i[r] = i[r + 1];
    i[3] = t;
    return i;
  },
  core: function(i: number[], t: number): number[] {
    i = this.rotate(i);
    for (let r = 0; r < 4; ++r) i[r] = this.sbox[i[r]];
    i[0] ^= this.Rcon[t];
    return i;
  },
  expandKey: function(i: number[]): number[] {
    const t = 16, r = 176, n = new Array(r);
    for (let s = 0; s < t; s++) n[s] = i[s];
    for (let e = t; e < r; e += 4) {
      let a = new Array(4);
      for (let s = 0; s < 4; s++) a[s] = n[e - 4 + s];
      if (e % t === 0) a = this.core(a, e / t);
      for (let s = 0; s < 4; s++) n[e + s] = n[e - t + s] ^ a[s];
    }
    return n;
  },
  createRoundKey: function(i: number[], t: number): number[] {
    const r: number[] = [];
    for (let o = 0; o < 4; o++)
      for (let n = 0; n < 4; n++)
        r[4 * n + o] = i[t + 4 * o + n];
    return r;
  },
  subBytes: function(i: number[], t: boolean): number[] {
    const s = t ? this.rsbox : this.sbox;
    for (let r = 0; r < 16; r++) i[r] = s[i[r]];
    return i;
  },
  shiftRow: function(i: number[], t: number, r: number, o: boolean): number[] {
    for (let n = 0; n < r; n++) {
      if (o) {
        const s = i[t + 3];
        for (let e = 3; e > 0; e--) i[t + e] = i[t + e - 1];
        i[t] = s;
      } else {
        const s = i[t];
        for (let e = 0; e < 3; e++) i[t + e] = i[t + e + 1];
        i[t + 3] = s;
      }
    }
    return i;
  },
  shiftRows: function(i: number[], t: boolean): number[] {
    for (let r = 0; r < 4; r++) i = this.shiftRow(i, 4 * r, r, t);
    return i;
  },
  addRoundKey: function(i: number[], t: number[]): number[] {
    for (let r = 0; r < 16; r++) i[r] ^= t[r];
    return i;
  },
  galois_multiplication: function(i: number, t: number): number {
    let r = 0;
    for (let o = 0; o < 8; o++) {
      if ((t & 1) === 1) r ^= i;
      const n = i & 128;
      i = (i << 1) & 0xff;
      if (n === 128) i ^= 27;
      t >>= 1;
    }
    return r;
  },
  mixColumn: function(i: number[], t: boolean): number[] {
    const r = t ? [14, 9, 13, 11] : [2, 1, 1, 3];
    const o = [i[0], i[1], i[2], i[3]];
    i[0] = this.galois_multiplication(o[0], r[0]) ^ this.galois_multiplication(o[3], r[1]) ^ this.galois_multiplication(o[2], r[2]) ^ this.galois_multiplication(o[1], r[3]);
    i[1] = this.galois_multiplication(o[1], r[0]) ^ this.galois_multiplication(o[0], r[1]) ^ this.galois_multiplication(o[3], r[2]) ^ this.galois_multiplication(o[2], r[3]);
    i[2] = this.galois_multiplication(o[2], r[0]) ^ this.galois_multiplication(o[1], r[1]) ^ this.galois_multiplication(o[0], r[2]) ^ this.galois_multiplication(o[3], r[3]);
    i[3] = this.galois_multiplication(o[3], r[0]) ^ this.galois_multiplication(o[2], r[1]) ^ this.galois_multiplication(o[1], r[2]) ^ this.galois_multiplication(o[0], r[3]);
    return i;
  },
  mixColumns: function(i: number[], t: boolean): number[] {
    for (let r = 0; r < 4; r++) {
      let o = [i[r], i[4 + r], i[8 + r], i[12 + r]];
      o = this.mixColumn(o, t);
      for (let s = 0; s < 4; s++) i[4 * s + r] = o[s];
    }
    return i;
  },
  invRound: function(i: number[], t: number[]): number[] {
    i = this.shiftRows(i, true);
    i = this.subBytes(i, true);
    i = this.addRoundKey(i, t);
    i = this.mixColumns(i, true);
    return i;
  },
  invMain: function(i: number[], t: number[], r: number): number[] {
    i = this.addRoundKey(i, this.createRoundKey(t, 16 * r));
    for (let o = r - 1; o > 0; o--) {
      i = this.invRound(i, this.createRoundKey(t, 16 * o));
    }
    i = this.shiftRows(i, true);
    i = this.subBytes(i, true);
    i = this.addRoundKey(i, this.createRoundKey(t, 0));
    return i;
  },
  decryptBlock: function(i: number[], t: number[]): number[] {
    const r = 10;
    const expanded = this.expandKey(t);
    let o = new Array(16);
    for (let e = 0; e < 4; e++) {
      for (let a = 0; a < 4; a++) {
        o[e + 4 * a] = i[4 * e + a];
      }
    }
    o = this.invMain(o, expanded, r);
    const res = new Array(16);
    for (let h = 0; h < 4; h++) {
      for (let u = 0; u < 4; u++) {
        res[4 * h + u] = o[h + 4 * u];
      }
    }
    return res;
  },
  decryptCbc: function(cipherBytes: number[], keyBytes: number[], ivBytes: number[]): number[] {
    const block = this.decryptBlock(cipherBytes.slice(0, 16), keyBytes);
    const plain = new Array(16);
    for (let i = 0; i < 16; i++) {
      plain[i] = block[i] ^ ivBytes[i];
    }
    return plain;
  }
};

export function hexToNumbers(hex: string): number[] {
  const result: number[] = [];
  hex.replace(/(..)/g, (match) => {
    result.push(parseInt(match, 16));
    return '';
  });
  return result;
}

export function numbersToHex(numbers: number[]): string {
  let hex = '';
  for (let f = 0; f < numbers.length; f++) {
    hex += (16 > numbers[f] ? '0' : '') + numbers[f].toString(16);
  }
  return hex.toLowerCase();
}

/**
 * Decrypts InfinityFree challenge parameters into the __test cookie value.
 */
export function decryptInfinityFreeCookie(aHex: string, bHex: string, cHex: string): string {
  const keyBytes = hexToNumbers(aHex);
  const ivBytes = hexToNumbers(bHex);
  const cipherBytes = hexToNumbers(cHex);

  const decryptedBytes = slowAES.decryptCbc(cipherBytes, keyBytes, ivBytes);
  return numbersToHex(decryptedBytes);
}

/**
 * Parses an HTML/JS response from InfinityFree and solves the __test cookie challenge if present.
 */
export function extractAndSolveChallenge(html: string): string | null {
  const match = html.match(/toNumbers\("([a-f0-9]+)"\),b=toNumbers\("([a-f0-9]+)"\),c=toNumbers\("([a-f0-9]+)"\)/);
  if (!match) return null;
  const [_, a, b, c] = match;
  return decryptInfinityFreeCookie(a, b, c);
}
