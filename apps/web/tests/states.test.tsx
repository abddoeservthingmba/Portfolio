import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncSection } from '@/components/States';

function renderSection(props: Partial<Parameters<typeof AsyncSection<string[]>>[0]> = {}) {
  return render(
    <AsyncSection<string[]>
      isLoading={false}
      error={null}
      data={['one']}
      skeleton={<p>Loading…</p>}
      empty={<p>Nothing here yet</p>}
      {...props}
    >
      {(items) => <p>{items.length} items</p>}
    </AsyncSection>,
  );
}

describe('AsyncSection', () => {
  it('shows the skeleton while loading', () => {
    renderSection({ isLoading: true, data: null });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the empty state for an empty array rather than an empty page', () => {
    renderSection({ data: [] });
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('shows the empty state for a null result', () => {
    renderSection({ data: null });
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders an error state, not a blank page, when the read fails', () => {
    renderSection({ error: new Error('cold backend'), data: null });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    // The failure reason never reaches the visitor.
    expect(screen.queryByText(/cold backend/i)).not.toBeInTheDocument();
  });

  it('offers a retry when one is available', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderSection({ error: new Error('failed'), data: null, onRetry });

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the content on a successful non-empty result', () => {
    renderSection();
    expect(screen.getByText('1 items')).toBeInTheDocument();
  });
});
