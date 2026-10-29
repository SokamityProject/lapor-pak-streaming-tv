import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Capacitor Android TV Manifest Config', () => {
  it('contains Leanback Launcher intent and touchscreen=false in AndroidManifest.xml', () => {
    const manifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = fs.readFileSync(manifestPath, 'utf-8');

    expect(manifest).toContain('android.intent.category.LEANBACK_LAUNCHER');
    expect(manifest).toContain('android.software.leanback');
    expect(manifest).toContain('android.hardware.touchscreen');
    expect(manifest).toContain('android:required="false"');
  });

  it('has app id com.laporpak.tv in capacitor.config.ts', () => {
    const configPath = path.resolve(__dirname, '../capacitor.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
    const configContent = fs.readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('com.laporpak.tv');
    expect(configContent).toContain('Lapor Pak! TV');
    expect(configContent).toContain('CapacitorHttp');
    expect(configContent).toContain('CapacitorCookies');
  });
});
