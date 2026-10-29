import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Scaffold Verification', () => {
  it('has package.json with React 19 and Vite', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies.react).toContain('19');
    expect(pkg.devDependencies.vite).toBeDefined();
    expect(pkg.scripts.build).toBe('tsc && vite build');
  });

  it('has tailwind.config.js with correct TV brand colors', () => {
    const tailwindPath = path.resolve(__dirname, '../tailwind.config.js');
    expect(fs.existsSync(tailwindPath)).toBe(true);
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf-8');
    expect(tailwindContent).toContain('#080B11');
    expect(tailwindContent).toContain('#F59E0B');
  });
});
