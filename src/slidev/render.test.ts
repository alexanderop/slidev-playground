import { parseFenceInfo } from './fences'

describe('parseFenceInfo', () => {
  it('parses start line and stepped highlight groups from Slidev fence metadata', () => {
    expect(parseFenceInfo('ts [demo.ts] {lines:true,startLine:5}{2-3|4|all}')).toEqual({
      filename: 'demo.ts',
      highlightSteps: [[2, 3], [4], ['all']],
      highlightedLines: [],
      language: 'ts',
      lineNumbers: true,
      startLine: 5,
    })
  })
})
