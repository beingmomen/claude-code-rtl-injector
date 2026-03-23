import * as assert from 'assert';
import { extractCurrentHashes } from '../../detector';

suite('Detector Tests', () => {
  test('extractCurrentHashes should extract hashes from CSS content', () => {
    const css = `
      .userMessage_abc123 { color: red; }
      .root_xyz789 { display: flex; }
      .messageInput_def456 { border: none; }
    `;
    const hashes = extractCurrentHashes(css);

    assert.strictEqual(hashes['userMessage'], 'abc123');
    assert.strictEqual(hashes['root'], 'xyz789');
    assert.strictEqual(hashes['messageInput'], 'def456');
  });

  test('extractCurrentHashes should return empty map for CSS without matching classes', () => {
    const css = '.someOtherClass { color: blue; }';
    const hashes = extractCurrentHashes(css);

    assert.strictEqual(Object.keys(hashes).length, 0);
  });

  test('extractCurrentHashes should handle hashes with hyphens and underscores', () => {
    const css = '.userMessage_a-b_c { color: red; }';
    const hashes = extractCurrentHashes(css);

    assert.strictEqual(hashes['userMessage'], 'a-b_c');
  });

  test('extractCurrentHashes should handle empty CSS', () => {
    const hashes = extractCurrentHashes('');
    assert.strictEqual(Object.keys(hashes).length, 0);
  });

  test('extractCurrentHashes should pick the first match when multiple exist', () => {
    const css = `
      .userMessage_first123 { color: red; }
      .userMessage_second456 { color: blue; }
    `;
    const hashes = extractCurrentHashes(css);

    assert.strictEqual(hashes['userMessage'], 'first123');
  });
});
