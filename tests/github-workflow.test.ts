import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GitHub Actions CI/CD Workflow', () => {
  it('defines valid workflow steps for building and archiving the Android TV APK', () => {
    const workflowPath = path.resolve(__dirname, '../.github/workflows/build-apk.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);
    const content = fs.readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('actions/checkout');
    expect(content).toContain('actions/setup-node');
    expect(content).toContain('actions/setup-java');
    expect(content).toContain('gradlew assembleDebug');
    expect(content).toContain('actions/upload-artifact');
    expect(content).toContain('lapor-pak-tv.apk');
  });
});
