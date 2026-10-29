import { describe, it, expect } from 'vitest';
import { decryptInfinityFreeCookie } from '../src/services/slowAes';

describe('InfinityFree Challenge Decryptor (slowAES)', () => {
  it('correctly decrypts the __test cookie from challenge parameters', () => {
    const a = 'f655ba9d09a112d4968c63579db590b4';
    const b = '98344c2eee86c3994890592585b49f80';
    const c = 'c4c77a73718eb5bb248fe400eef76eb5';

    const testCookie = decryptInfinityFreeCookie(a, b, c);
    expect(testCookie).toBe('2f312d304562ccae42675f89848424b1');
  });

  it('handles parsing raw challenge script content', () => {
    const script = `
      var a=toNumbers("f655ba9d09a112d4968c63579db590b4"),b=toNumbers("98344c2eee86c3994890592585b49f80"),c=toNumbers("c4c77a73718eb5bb248fe400eef76eb5");
      document.cookie="__test="+toHex(slowAES.decrypt(c,2,a,b))+"; max-age=21600; expires=Thu, 31-Dec-37 23:55:55 GMT; path=/"; location.href="https://laporpak.my.to/?i=1";
    `;

    const match = script.match(/toNumbers\("([a-f0-9]+)"\),b=toNumbers\("([a-f0-9]+)"\),c=toNumbers\("([a-f0-9]+)"\)/);
    expect(match).not.toBeNull();
    if (match) {
      const [_, a, b, c] = match;
      const testCookie = decryptInfinityFreeCookie(a, b, c);
      expect(testCookie).toBe('2f312d304562ccae42675f89848424b1');
    }
  });
});
