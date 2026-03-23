import * as assert from 'assert';
import { remapHashes, isAlreadyInjected } from '../../injector';
import { MARKER_START, MARKER_END, CLASS_NAME_BASES } from '../../constants';

suite('Injector Tests', () => {
  suite('isAlreadyInjected', () => {
    test('should return true when both markers are present', () => {
      const css = `body { color: red; }\n${MARKER_START}\n.rtl{}\n${MARKER_END}`;
      assert.strictEqual(isAlreadyInjected(css), true);
    });

    test('should return false when no markers are present', () => {
      const css = 'body { color: red; }';
      assert.strictEqual(isAlreadyInjected(css), false);
    });

    test('should return false when only start marker is present', () => {
      const css = `body { color: red; }\n${MARKER_START}\n.rtl{}`;
      assert.strictEqual(isAlreadyInjected(css), false);
    });

    test('should return false when only end marker is present', () => {
      const css = `body { color: red; }\n.rtl{}\n${MARKER_END}`;
      assert.strictEqual(isAlreadyInjected(css), false);
    });
  });

  suite('remapHashes', () => {
    test('should remap hashes when template and current hashes differ', () => {
      const templateCss = '.userMessage_oldHash { direction: rtl; }';
      const currentHashes = { userMessage: 'newHash' };

      const result = remapHashes(templateCss, currentHashes);

      assert.ok(result.css.includes('.userMessage_newHash'));
      assert.ok(!result.css.includes('.userMessage_oldHash'));
      assert.strictEqual(result.remapped, 1);
      assert.strictEqual(result.unmatched.length, 0);
    });

    test('should not remap when hashes are the same', () => {
      const templateCss = '.userMessage_sameHash { direction: rtl; }';
      const currentHashes = { userMessage: 'sameHash' };

      const result = remapHashes(templateCss, currentHashes);

      assert.ok(result.css.includes('.userMessage_sameHash'));
      assert.strictEqual(result.remapped, 0);
    });

    test('should report unmatched bases when current hash is missing', () => {
      const templateCss = '.userMessage_oldHash { direction: rtl; }';
      const currentHashes = {}; // no userMessage hash

      const result = remapHashes(templateCss, currentHashes);

      assert.ok(result.unmatched.includes('userMessage'));
    });

    test('should handle template with no matching class bases', () => {
      const templateCss = '.unknownClass_hash { direction: rtl; }';
      const currentHashes = { userMessage: 'abc123' };

      const result = remapHashes(templateCss, currentHashes);

      assert.strictEqual(result.remapped, 0);
      assert.strictEqual(result.unmatched.length, 0);
    });

    test('should remap multiple hashes at once', () => {
      const templateCss = `
        .userMessage_old1 { direction: rtl; }
        .root_old2 { text-align: right; }
        .messageInput_old3 { direction: rtl; }
      `;
      const currentHashes = {
        userMessage: 'new1',
        root: 'new2',
        messageInput: 'new3',
      };

      const result = remapHashes(templateCss, currentHashes);

      assert.ok(result.css.includes('.userMessage_new1'));
      assert.ok(result.css.includes('.root_new2'));
      assert.ok(result.css.includes('.messageInput_new3'));
      assert.strictEqual(result.remapped, 3);
    });
  });

  suite('Constants Validation', () => {
    test('CLASS_NAME_BASES should contain non-empty strings', () => {
      assert.ok(CLASS_NAME_BASES.length > 0);
      CLASS_NAME_BASES.forEach((base) => {
        assert.ok(typeof base === 'string');
        assert.ok(base.length > 0);
      });
    });

    test('MARKER_START and MARKER_END should be distinct', () => {
      assert.notStrictEqual(MARKER_START, MARKER_END);
    });
  });
});
