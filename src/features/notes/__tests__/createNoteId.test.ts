import { describe, expect, it } from '@jest/globals';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(async () => []),
  })),
}));

jest.mock('../../../services/notifications', () => ({
  cancelNotificationById: jest.fn(),
}));

import { createNoteId } from '../useNotes';

describe('createNoteId', () => {
  it('does not collide for notes created in the same millisecond', () => {
    const now = 1_700_000_000_000;
    const ids = new Set(
      Array.from({ length: 2000 }, () => createNoteId(now)),
    );

    // The old implementation returned String(now) here, so this set had size 1
    // and every insert after the first hit a PRIMARY KEY constraint.
    expect(ids.size).toBe(2000);
  });

  it('keeps ids sortable by creation time', () => {
    const earlier = createNoteId(1_700_000_000_000);
    const later = createNoteId(1_700_000_001_000);

    expect(earlier.split('-')[0] < later.split('-')[0]).toBe(true);
  });
});
