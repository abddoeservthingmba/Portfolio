import { useRef, useState } from 'react';
import { InputField, TextareaField } from '@/components/Field';
import { Button } from '@/components/Button';
import { useToast } from '@/components/toast/ToastContext';
import { submitContact } from '@/lib/content';
import { validateContact, type ContactErrors, LIMITS } from './contactValidation';
import type { ContactSubmission } from '@/types/content';

const EMPTY: ContactSubmission = { name: '', email: '', subject: '', message: '' };

export function ContactForm() {
  const [values, setValues] = useState<ContactSubmission>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Honeypot: a hidden field a human never fills, and the moment the form was
  // mounted. Both travel to the server, which is where they are judged.
  const [honeypot, setHoneypot] = useState('');
  const mountedAt = useRef(Date.now());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      // The heuristics are sent, not judged here. The server decides, and
      // discards silently — so a real submission and a discarded one look
      // identical from this side (C6).
      await submitContact({
        ...values,
        company: honeypot,
        dwellMs: Date.now() - mountedAt.current,
      });
      resetToSuccess();
    } catch {
      toast.error('Your message could not be sent. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  function resetToSuccess() {
    setValues(EMPTY);
    setErrors({});
    mountedAt.current = Date.now();
    toast.success('Thanks — your message has been sent.');
  }

  const update = (field: keyof ContactSubmission) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clearing on edit means an error never sits under a field the visitor fixed.
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          label="Name"
          name="name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(event) => update('name')(event.target.value)}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => update('email')(event.target.value)}
        />
      </div>

      <InputField
        label="Subject"
        name="subject"
        value={values.subject}
        error={errors.subject}
        onChange={(event) => update('subject')(event.target.value)}
      />

      <TextareaField
        label="Message"
        name="message"
        value={values.message}
        error={errors.message}
        hint={`At least ${LIMITS.message.min} characters.`}
        onChange={(event) => update('message')(event.target.value)}
      />

      <HoneypotField value={honeypot} onChange={setHoneypot} />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}

/**
 * Hidden from sight, from assistive technology and from tab order — but not
 * with `display: none`, which some bots skip. Anything that fills it is not a
 * person.
 */
function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="contact-company">Company (leave this field empty)</label>
      <input
        id="contact-company"
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
