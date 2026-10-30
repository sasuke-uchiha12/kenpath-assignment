import { describe, expect, it } from 'vitest';
import { changeLanguage } from './state';
describe('language selection', () => {
  it('retains an unfinished officer reason when the language changes', () => {
    expect(changeLanguage({language:'en',reason:'Please provide proof'}, 'ta')).toEqual({language:'ta',reason:'Please provide proof'});
  });
});
