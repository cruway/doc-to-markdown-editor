import { describe, it, expect } from 'vitest'
import { classifySlot } from '../fileService'

// P2-04: fileService.ts の classifySlot テスト

describe('classifySlot', () => {
  it('should classify 起 by Japanese character', () => {
    expect(classifySlot('起-introduction.docx')).toBe('起')
  })

  it('should classify 起 by English keyword "intro"', () => {
    expect(classifySlot('chapter-intro.md')).toBe('起')
  })

  it('should classify 起 by "opening"', () => {
    expect(classifySlot('opening_remarks.txt')).toBe('起')
  })

  it('should classify 承 by Japanese character', () => {
    expect(classifySlot('承-development.docx')).toBe('承')
  })

  it('should classify 承 by "body"', () => {
    expect(classifySlot('body-content.md')).toBe('承')
  })

  it('should classify 承 by "main"', () => {
    expect(classifySlot('main_section.html')).toBe('承')
  })

  it('should classify 転 by Japanese character', () => {
    expect(classifySlot('転-twist.docx')).toBe('転')
  })

  it('should classify 転 by "twist"', () => {
    expect(classifySlot('plot-twist.md')).toBe('転')
  })

  it('should classify 転 by "turn"', () => {
    expect(classifySlot('turning_point.txt')).toBe('転')
  })

  it('should classify 結 by Japanese character', () => {
    expect(classifySlot('結-summary.docx')).toBe('結')
  })

  it('should classify 結 by "conclusion"', () => {
    expect(classifySlot('conclusion.md')).toBe('結')
  })

  it('should classify 結 by "ending"', () => {
    expect(classifySlot('ending-notes.txt')).toBe('結')
  })

  it('should return null for unclassifiable files', () => {
    expect(classifySlot('random-document.docx')).toBeNull()
  })

  it('should be case-insensitive for English keywords', () => {
    expect(classifySlot('INTRO.docx')).toBe('起')
    expect(classifySlot('BODY.md')).toBe('承')
    expect(classifySlot('CONCLUSION.txt')).toBe('結')
  })

  it('should match keywords in any position', () => {
    expect(classifySlot('my-intro-document.docx')).toBe('起')
    expect(classifySlot('2024-body-report.md')).toBe('承')
  })
})
