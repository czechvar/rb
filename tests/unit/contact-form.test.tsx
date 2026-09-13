// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ContactForm } from '@/components/contact/ContactForm'
import type { ActionResult } from '@/components/forms/action-result'

afterEach(cleanup)

it('offers direct contact without collecting personal details when delivery is unavailable', () => {
  const { container } = render(<ContactForm heading="Tell us where you’re at" />)
  expect(container.querySelectorAll('input, textarea, select, button')).toHaveLength(0)
  expect(screen.getByRole('link', { name: 'See our contact details' }).getAttribute('href')).toBe('/contact#contact-details')
  expect(screen.queryByRole('alert')).toBeNull()
})

it('requires a visitor phone number only for a phone or WhatsApp reply', () => {
  render(<ContactForm heading="Contact" action={async () => ({ ok: true })} />)
  expect(screen.queryByLabelText('Your phone number (including country code)')).toBeNull()
  fireEvent.change(screen.getByLabelText('Preferred contact method'), { target: { value: 'whatsapp' } })
  const phone = screen.getByLabelText('Your phone number (including country code)') as HTMLInputElement
  expect(phone.required).toBe(true)
  fireEvent.change(phone, { target: { value: '+420 123 456 789' } })
  fireEvent.change(screen.getByLabelText('Preferred contact method'), { target: { value: 'email' } })
  expect(screen.queryByLabelText('Your phone number (including country code)')).toBeNull()
})

it('locks pending submissions, retains failed content, focuses errors, and permits a successful retry', async () => {
  let finish: (result: ActionResult) => void = () => {}
  const action = vi.fn().mockImplementationOnce(() => new Promise<ActionResult>(resolve => { finish = resolve })).mockResolvedValueOnce({ ok: true })
  render(<ContactForm heading="Contact" action={action} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Climber' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'climber@example.test' } })
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Can you help me choose a climbing trip?' } })
  fireEvent.submit(screen.getByRole('form', { name: 'Contact' }))
  await waitFor(() => expect((screen.getByRole('button', { name: 'Sending…' }) as HTMLButtonElement).disabled).toBe(true))
  expect(screen.getByLabelText('Name').closest('fieldset')?.disabled).toBe(true)
  const firstData = action.mock.calls[0][1] as FormData
  const submissionId = firstData.get('submissionId')
  expect(submissionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  expect(firstData.get('website')).toBe('')
  fireEvent.submit(screen.getByRole('form', { name: 'Contact' }))
  expect(action).toHaveBeenCalledTimes(1)
  await act(async () => finish({ ok: false, formError: 'Please check your message.', fieldErrors: { message: 'Add your preferred dates.' } }))
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Test Climber')
  expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('Can you help me choose a climbing trip?')
  expect(document.activeElement).toBe(screen.getByLabelText('Message'))
  expect(screen.queryByRole('status')).toBeNull()
  fireEvent.submit(screen.getByRole('form', { name: 'Contact' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Your enquiry has been received'))
  expect(action).toHaveBeenCalledTimes(2)
  expect((action.mock.calls[1][1] as FormData).get('submissionId')).toBe(submissionId)
})


it('keeps the honeypot outside keyboard and accessibility navigation', () => {
  const { container } = render(<ContactForm heading="Contact" action={async () => ({ ok: true })} />)
  const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]')!
  expect(honeypot.tabIndex).toBe(-1)
  expect(honeypot.autocomplete).toBe('off')
  expect(honeypot.closest('[hidden][aria-hidden="true"]')).not.toBeNull()
  expect(screen.queryByRole('textbox', { name: 'Website' })).toBeNull()
})


it('uses a new submission ID after editing a failed enquiry', async () => {
  const action = vi.fn().mockResolvedValueOnce({ ok: false, formError: 'Please try again.' }).mockResolvedValueOnce({ ok: true })
  render(<ContactForm heading="Contact" action={action} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Climber' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'climber@example.test' } })
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Help me choose a trip.' } })
  fireEvent.submit(screen.getByRole('form', { name: 'Contact' }))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Please try again.'))
  const firstId = (action.mock.calls[0][1] as FormData).get('submissionId')
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Help me choose a trip in October.' } })
  fireEvent.submit(screen.getByRole('form', { name: 'Contact' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Your enquiry has been received'))
  const nextId = (action.mock.calls[1][1] as FormData).get('submissionId')
  expect(nextId).toBeTruthy()
  expect(nextId).not.toBe(firstId)
})
