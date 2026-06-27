/**
 * Minimal self-check for the provider key-detection/validation logic.
 * Pure functions only (no Figma runtime) — bundled by esbuild and run on node.
 *   npm test
 */
import { strict as assert } from 'assert';
import { detectProviderFromKey, validateApiKeyFormat } from '../src/api/providers/types';

// detectProviderFromKey: prefix routing (sk-ant- must win over the generic sk-)
assert.equal(detectProviderFromKey('sk-ant-abc123'), 'anthropic');
assert.equal(detectProviderFromKey('sk-proj-abc123'), 'openai');
assert.equal(detectProviderFromKey('AIzaSyabc'), 'google');
assert.equal(detectProviderFromKey('AQ.abc'), 'google');
assert.equal(detectProviderFromKey('github_pat_abc'), 'github');
assert.equal(detectProviderFromKey('ghp_abc'), 'github');
assert.equal(detectProviderFromKey('nonsense'), undefined);

// validateApiKeyFormat: length + prefix gates per provider
assert.equal(validateApiKeyFormat('sk-ant-' + 'x'.repeat(40), 'anthropic'), true);
assert.equal(validateApiKeyFormat('sk-ant-short', 'anthropic'), false);
assert.equal(validateApiKeyFormat('sk-' + 'x'.repeat(20), 'openai'), true);
assert.equal(validateApiKeyFormat('AIza' + 'x'.repeat(30), 'google'), true);
assert.equal(validateApiKeyFormat('AIza', 'google'), false); // too short
assert.equal(validateApiKeyFormat('AIza' + 'x'.repeat(120), 'google'), false); // too long
assert.equal(validateApiKeyFormat('AIza' + 'x'.repeat(30), 'anthropic'), false); // google key, wrong provider
assert.equal(validateApiKeyFormat('github_pat_' + 'x'.repeat(20), 'github'), true);
assert.equal(validateApiKeyFormat('ghp_' + 'x'.repeat(36), 'github'), true);
assert.equal(validateApiKeyFormat('ghp_short', 'github'), false); // too short
assert.equal(validateApiKeyFormat('sk-ant-' + 'x'.repeat(40), 'github'), false); // anthropic key, wrong provider

console.log('selfcheck passed');
