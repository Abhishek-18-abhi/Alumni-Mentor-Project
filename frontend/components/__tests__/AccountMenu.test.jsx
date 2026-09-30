import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AccountMenu from '../AccountMenu';
import { setSession } from '../../lib/storage';

beforeEach(() => {
  localStorage.clear();
  setSession({ id: 'u1', name: 'Test User', email: 'test@test.com', role: 'student' });
});

function renderMenu() {
  return render(
    <MemoryRouter>
      <AccountMenu />
    </MemoryRouter>
  );
}

describe('AccountMenu', () => {
  it('opens the dropdown on trigger click', async () => {
    renderMenu();
    await userEvent.click(screen.getByText('Test User'));
    expect(screen.getByText('Switch account')).toBeInTheDocument();
  });

  it('closes when clicking outside the menu', async () => {
    renderMenu();
    await userEvent.click(screen.getByText('Test User'));
    expect(screen.getByText('Switch account')).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByText('Switch account')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderMenu();
    await userEvent.click(screen.getByText('Test User'));
    expect(screen.getByText('Switch account')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Switch account')).not.toBeInTheDocument();
  });
});
