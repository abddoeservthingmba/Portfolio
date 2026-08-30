import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/features/contact/ContactForm';
import { ToastProvider } from '@/components/toast/ToastProvider';
import * as content from '@/lib/content';

function renderForm() {
  return render(
    <ToastProvider>
      <ContactForm />
    </ToastProvider>,
  );
}

/** The form discards submissions made faster than a person could type. */
async function waitPastDwellCheck() {
  await new Promise((done) => setTimeout(done, 2100));
}

beforeEach(() => {
  vi.spyOn(content, 'submitContact').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function fillValidMessage(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
  await user.type(screen.getByLabelText(/^subject$/i), 'About a role');
  await user.type(
    screen.getByLabelText(/^message$/i),
    'I read through the architecture notes and had a question about the boundary.',
  );
}

describe('ContactForm', () => {
  it('rejects invalid input without dispatching a request', async () => {
    const user = userEvent.setup();
    renderForm();
    await waitPastDwellCheck();

    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/please enter your name/i)).toBeInTheDocument();
    expect(content.submitContact).not.toHaveBeenCalled();
  });

  it('reports an invalid email address on the email field', async () => {
    const user = userEvent.setup();
    renderForm();
    await waitPastDwellCheck();

    await user.type(screen.getByLabelText(/^email$/i), 'not-an-address');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(content.submitContact).not.toHaveBeenCalled();
  });

  it('submits a valid message and confirms it', async () => {
    const user = userEvent.setup();
    renderForm();
    await waitPastDwellCheck();

    await user.type(screen.getByLabelText(/^name$/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^subject$/i), 'About a role');
    await user.type(
      screen.getByLabelText(/^message$/i),
      'I read through the architecture notes and had a question about the boundary.',
    );

    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(content.submitContact).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/your message has been sent/i)).toBeInTheDocument();
  });

  it('sends the honeypot value for the server to judge', async () => {
    const user = userEvent.setup();
    const { container } = renderForm();
    await waitPastDwellCheck();

    const honeypot = container.querySelector<HTMLInputElement>('input[name="company"]')!;
    await user.type(honeypot, 'spam-bot-co');

    await fillValidMessage(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // The client reports the signal; it does not decide. A browser check is
    // trivially bypassed, so the discard happens server-side (C6).
    await waitFor(() => expect(content.submitContact).toHaveBeenCalledTimes(1));
    expect(vi.mocked(content.submitContact).mock.calls[0]?.[0]).toMatchObject({
      company: 'spam-bot-co',
    });
  });

  it('sends how long the form was on screen', async () => {
    const user = userEvent.setup();
    renderForm();
    await waitPastDwellCheck();

    await fillValidMessage(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(content.submitContact).toHaveBeenCalledTimes(1));
    const submitted = vi.mocked(content.submitContact).mock.calls[0]?.[0] as { dwellMs: number };
    expect(submitted.dwellMs).toBeGreaterThan(2000);
  });
});
