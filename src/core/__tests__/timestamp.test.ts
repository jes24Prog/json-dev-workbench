import { fromMilliseconds, fromSeconds, convertTimestamp, formatDuration } from '../timestamp';

describe('fromMilliseconds', () => {
  it('produces consistent representations', () => {
    const result = fromMilliseconds(1_700_000_000_000);
    expect(result.milliseconds).toBe('1700000000000');
    expect(result.seconds).toBe('1700000000');
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
  });
});

describe('fromSeconds', () => {
  it('converts seconds to milliseconds', () => {
    const result = fromSeconds(1_700_000_000);
    expect(result.milliseconds).toBe('1700000000000');
  });
});

describe('convertTimestamp', () => {
  it('converts seconds input', () => {
    const result = convertTimestamp({ kind: 'seconds', value: '1700000000' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.result.milliseconds).toBe('1700000000000');
  });

  it('converts milliseconds input', () => {
    const result = convertTimestamp({ kind: 'milliseconds', value: '1700000000000' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.result.seconds).toBe('1700000000');
  });

  it('converts ISO input', () => {
    const result = convertTimestamp({ kind: 'iso', value: '2023-11-14T22:13:20.000Z' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.result.milliseconds).toBe('1700000000000');
  });

  it('rejects invalid seconds', () => {
    const result = convertTimestamp({ kind: 'seconds', value: 'abc' });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid ISO dates', () => {
    const result = convertTimestamp({ kind: 'iso', value: 'not a date' });
    expect(result.ok).toBe(false);
  });
});

describe('formatDuration', () => {
  it('formats sub-second and multi-minute durations', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(90_000)).toBe('1m 30s');
  });
});
