// @vitest-environment node
/** Emits docs/preview-models.json used by scripts/render_previews.py. */
import { describe, it, expect } from 'vitest';
import { emitPreviewModels } from '../scripts/emit-preview-models';

describe('preview models', () => {
  it('writes all 30 templates in both document languages', () => {
    const count = emitPreviewModels();
    expect(count).toBe(60);
  });
});
