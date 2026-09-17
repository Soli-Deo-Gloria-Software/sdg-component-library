import { describe, it, expect } from 'vitest';
import { AVATAR_COLORS, getAvatarColor, hashName } from './avatar-color';

describe('hashName', () => {
  it('returns a non-negative integer', () => {
    expect(hashName('Alice')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hashName('Alice'))).toBe(true);
  });

  it('is stable for the same input', () => {
    expect(hashName('Thomas Matthew Wood')).toEqual(hashName('Thomas Matthew Wood'));
  });

  it('produces different values for different names', () => {
    expect(hashName('Alice')).not.toEqual(hashName('Bob'));
  });
});

describe('getAvatarColor', () => {
  it('returns a color from the palette', () => {
    expect(AVATAR_COLORS).toContain(getAvatarColor('Jane Doe'));
  });

  it('maps the same name to the same color', () => {
    expect(getAvatarColor('Jane Doe')).toEqual(getAvatarColor('Jane Doe'));
  });

  it('selects by hash modulo palette length', () => {
    const name = 'Jane Doe';
    const expected = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
    expect(getAvatarColor(name)).toEqual(expected);
  });

  it('falls back to the first color when name is empty', () => {
    expect(getAvatarColor('')).toEqual(AVATAR_COLORS[0]);
  });
});
