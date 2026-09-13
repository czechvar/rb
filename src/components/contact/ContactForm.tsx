'use client'

import React, { useActionState, useEffect, useId, useRef, useState } from 'react'
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import formStyles from '@/components/forms/forms.module.css'
import styles from './contact.module.css'

export type ContactFormProps = {
  eyebrow?: string | null
  heading: string
  body?: string | null
  facts?: { id?: string | null; text: string }[] | null
  submitLabel?: string | null
  privacyNote?: string | null
  action?: (previous: ActionResult | null, data: FormData) => Promise<ActionResult>
  unavailableMessage?: string
}

const emptyValues = { name: '', email: '', level: '', interest: '', message: '', preferredContact: 'email', phone: '' }
type FieldName = keyof typeof emptyValues

export function ContactForm({ eyebrow, heading, body, facts, submitLabel, privacyNote, action, unavailableMessage }: ContactFormProps) {
  const id = useId()
  const [values, setValues] = useState(emptyValues)
  const formRef = useRef<HTMLFormElement>(null)
  const submissionId = useRef<string | null>(null)
  const submitting = useRef(false)
  const [state, submit, pending] = useActionState<ActionResult, FormData>(async (previous, data) => {
    if (!action) return { ok: false, formError: unavailableMessage || 'The enquiry form is currently unavailable. Please use the contact details above.' }
    if (previous.ok) return previous
    try {
      submissionId.current ??= crypto.randomUUID()
      data.set('submissionId', submissionId.current)
      return await action(previous, data)
    } catch {
      return { ok: false, formError: 'Your message could not be sent. Please try again, or use the contact details above.' }
    } finally {
      submitting.current = false
    }
  }, INITIAL_ACTION_STATE)
  const errors = !state.ok ? state.fieldErrors : undefined
  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state])
  const fieldProps = (name: FieldName) => ({
    id: `${id}-${name}`, name, value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      submissionId.current = null
      setValues(current => ({ ...current, [name]: event.target.value }))
    },
    'aria-invalid': Boolean(errors?.[name]) || undefined,
    'aria-describedby': errors?.[name] ? `${id}-${name}-error` : undefined,
    className: formStyles.input,
  })
  const field = (name: FieldName, label: string, control: React.ReactNode) => <div className={formStyles.field}>
    <label className={formStyles.label} htmlFor={`${id}-${name}`}>{label}</label>
    {control}
    {errors?.[name] && <span id={`${id}-${name}-error`} className={formStyles.error}>{errors[name]}</span>}
  </div>
  return (
    <section className={styles.formSection}>
      <div className={`${styles.inner} ${styles.formLayout}`}>
        <div className={styles.formSide}>
          {eyebrow && <p className={styles.eyebrow} data-eyebrow="section">{eyebrow}</p>}
          <h2 className={styles.heading}>{heading}</h2>
          {body && <p className={styles.body}>{body}</p>}
          {!!facts?.length && <ul className={styles.facts}>{facts.map((fact, index) => <li key={fact.id || index}>{fact.text}</li>)}</ul>}
        </div>
        <form ref={formRef} action={submit} className={styles.form} aria-label={heading} aria-busy={pending}
          onSubmit={event => {
            if (submitting.current || state.ok || !action) event.preventDefault()
            else submitting.current = true
          }}
        >
          {state.ok ? <FormBanner kind="success">Your enquiry has been received. Thank you for getting in touch.</FormBanner> : <>
            {!action && <p className={styles.unavailable}>{unavailableMessage || 'To discuss a trip or ask a question, get in touch directly.'} <a href="/contact#contact-details">See our contact details</a>.</p>}
            {action && <>
            {state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
            <fieldset disabled={pending} className={styles.fields}>
              <legend className={styles.srOnly}>Your enquiry</legend>
              <div hidden aria-hidden="true">
                <label htmlFor={`${id}-website`}>Website</label>
                <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className={styles.formRow}>
                {field('name', 'Name', <input {...fieldProps('name')} autoComplete="name" required maxLength={120} />)}
                {field('email', 'Email', <input {...fieldProps('email')} type="email" autoComplete="email" required maxLength={254} />)}
              </div>
              <div className={styles.formRow}>
                {field('level', 'Your climbing level', <select {...fieldProps('level')}>
                  <option value="">Select your level (optional)</option>
                  <option value="beginner">Beginner / Learning to Lead</option>
                  <option value="intermediate">Intermediate (5c–6b)</option>
                  <option value="advanced">Advanced (6c–7b)</option>
                  <option value="strong">Strong (7b+ and up)</option>
                  <option value="unsure">Not sure yet</option>
                </select>)}
                {field('interest', 'Interested in', <select {...fieldProps('interest')}>
                  <option value="">Select an interest (optional)</option>
                  <option value="sport">Sport Climbing Holiday</option>
                  <option value="bouldering">Bouldering Camp</option>
                  <option value="learn-to-lead">Learn to Lead</option>
                  <option value="performance">Performance & Technique Camp</option>
                  <option value="trad">Trad &amp; Multi-Pitch Course</option>
                  <option value="road-trip">Road Trip / Expedition</option>
                  <option value="unsure">Not sure yet — advise me</option>
                </select>)}
              </div>
              {field('message', 'Message', <textarea {...fieldProps('message')} required maxLength={5000} rows={6} placeholder="Tell us about your climbing, your goals, and what you have in mind." />)}
              {field('preferredContact', 'Preferred contact method', <select {...fieldProps('preferredContact')}>
                <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option>
              </select>)}
              {values.preferredContact !== 'email' && field('phone', 'Your phone number (including country code)', <input {...fieldProps('phone')} type="tel" autoComplete="tel" required maxLength={40} />)}
              <button className={`${formStyles.submit} ${styles.submit}`} type="submit" disabled={pending || !action}>{pending ? 'Sending…' : submitLabel || 'Send Message'}</button>
            </fieldset>
            {privacyNote && <p className={styles.privacy}>{privacyNote}</p>}
            </>}
          </>}
        </form>
      </div>
    </section>
  )
}
