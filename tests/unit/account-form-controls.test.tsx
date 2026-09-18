// tests/unit/account-form-controls.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import forms from '@/components/forms/forms.module.css'
import checkout from '@/components/checkout/checkout.module.css'
import { FormField } from '@/components/forms/FormField'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { AccountField, AccountSubmit } from '@/app/(frontend)/account/form-controls'

it('FormField renders its original markup when no classNames are passed', () => {
  const html = renderToStaticMarkup(
    <FormField name="city" label="City" helpText="Help" error="Bad" defaultValue="x" required />,
  )
  expect(html).toBe(
    `<div class="${forms.field}"><label class="${forms.label}" for="field-city">City</label>` +
      `<input id="field-city" type="text" required="" aria-describedby="field-city-help field-city-error" aria-invalid="true" class="${forms.input}" name="city" value="x"/>` +
      `<span id="field-city-help" style="font-size:13px;color:#666">Help</span>` +
      `<span id="field-city-error" role="alert" class="${forms.error}">Bad</span></div>`,
  )
})

it('FormField swaps in the given classes wholesale and drops the inline help colour', () => {
  const html = renderToStaticMarkup(
    <FormField
      name="city"
      label="City"
      helpText="Help"
      error="Bad"
      classNames={{ field: 'f', help: 'h', error: 'e' }}
    />,
  )
  expect(html).toContain('<div class="f">')
  expect(html).toContain('<label for="field-city">City</label>')
  expect(html).toContain('<span id="field-city-help" class="h">Help</span>')
  expect(html).toContain('<span id="field-city-error" role="alert" class="e">Bad</span>')
  expect(html).not.toContain('#666')
  expect(html).not.toContain(forms.input)
  expect(html).not.toContain(forms.label)
})

it('SubmitButton keeps its default class and accepts a replacement', () => {
  expect(renderToStaticMarkup(<SubmitButton>Save</SubmitButton>)).toBe(
    `<button type="submit" class="${forms.submit}">Save</button>`,
  )
  expect(renderToStaticMarkup(<SubmitButton className="btn-primary x">Save</SubmitButton>)).toBe(
    '<button type="submit" class="btn-primary x">Save</button>',
  )
})

it('AccountField and AccountSubmit carry the checkout look', () => {
  const html = renderToStaticMarkup(<AccountField name="city" label="City" helpText="Help" />)
  expect(html).toContain(`<div class="${checkout.field}">`)
  expect(html).toContain(`class="${checkout.helper}"`)
  expect(html).not.toContain(forms.input)
  expect(renderToStaticMarkup(<AccountSubmit>Save details</AccountSubmit>)).toBe(
    `<button type="submit" class="btn-primary ${checkout.button}">Save details</button>`,
  )
})
