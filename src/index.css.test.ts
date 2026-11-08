import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import './index.css'

function mountTypeOptionFixture() {
  document.body.innerHTML = `
    <form class="card-form panel">
      <fieldset class="field type-picker">
        <legend>Card type</legend>
        <div class="type-options" role="radiogroup" aria-label="Card type">
          <label class="type-option">
            <input type="radio" name="card-type" value="open" checked />
            <span>Open question</span>
          </label>
          <label class="type-option">
            <input type="radio" name="card-type" value="trueFalse" />
            <span>True / false</span>
          </label>
          <label class="type-option">
            <input type="radio" name="card-type" value="multiple" />
            <span>Multiple choice</span>
          </label>
        </div>
      </fieldset>
      <fieldset class="field">
        <legend>Multiple-choice options</legend>
        <div class="option-editor">
          <label class="option-row">
            <input type="radio" name="correct-option" checked aria-label="Mark option 1 as correct" />
            <input type="text" value="Option 1" />
          </label>
        </div>
      </fieldset>
    </form>
  `
}

describe('card type picker styles', () => {
  beforeEach(() => {
    mountTypeOptionFixture()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('does not style type-option radios as full-width text fields', () => {
    const radios = Array.from(
      document.querySelectorAll<HTMLInputElement>('.type-option input[type="radio"]'),
    )
    expect(radios).toHaveLength(3)

    for (const radio of radios) {
      const style = getComputedStyle(radio)
      expect(style.width).not.toBe('100%')
      expect(style.paddingTop).toBe('0px')
      expect(style.paddingRight).toBe('0px')
      expect(style.paddingBottom).toBe('0px')
      expect(style.paddingLeft).toBe('0px')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent').toBe(
        true,
      )
    }

    expect(document.body.textContent).toContain('Open question')
    expect(document.body.textContent).toContain('True / false')
    expect(document.body.textContent).toContain('Multiple choice')
  })

  it('keeps option-row radios compact beside text inputs', () => {
    const radio = document.querySelector<HTMLInputElement>(
      '.option-row input[type="radio"]',
    )
    const text = document.querySelector<HTMLInputElement>(
      '.option-row input[type="text"]',
    )

    expect(radio).not.toBeNull()
    expect(text).not.toBeNull()

    const radioStyle = getComputedStyle(radio!)
    const textStyle = getComputedStyle(text!)

    expect(radioStyle.width).not.toBe('100%')
    expect(radioStyle.paddingTop).toBe('0px')
    expect(textStyle.width).toBe('100%')
  })
})
