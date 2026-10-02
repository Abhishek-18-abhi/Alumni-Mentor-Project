import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChipPicker from '../ChipPicker';

describe('ChipPicker', () => {
  it('renders available options as rounded chip pills', () => {
    const options = ['React', 'Node.js', 'Python'];
    render(<ChipPicker options={options} selected={['React']} onChange={() => {}} />);

    const reactBtn = screen.getByRole('button', { name: /React/i });
    const nodeBtn = screen.getByRole('button', { name: /Node.js/i });

    expect(reactBtn).toHaveClass('chip');
    expect(reactBtn).toHaveClass('selected');
    expect(nodeBtn).toHaveClass('chip');
    expect(nodeBtn).not.toHaveClass('selected');
  });

  it('calls onChange when clicking an unselected chip', () => {
    const onChange = vi.fn();
    render(<ChipPicker options={['React', 'Python']} selected={['React']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Python/i }));
    expect(onChange).toHaveBeenCalledWith(['React', 'Python']);
  });

  it('calls onChange to deselect when clicking a selected chip', () => {
    const onChange = vi.fn();
    render(<ChipPicker options={['React', 'Python']} selected={['React']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /React/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds custom chip when typing and clicking Add', () => {
    const onChange = vi.fn();
    render(
      <ChipPicker
        options={['React']}
        selected={['React']}
        onChange={onChange}
        allowCustom={true}
        placeholder="Add custom skill..."
      />
    );

    const input = screen.getByPlaceholderText('Add custom skill...');
    fireEvent.change(input, { target: { value: 'Rust' } });

    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);

    expect(onChange).toHaveBeenCalledWith(['React', 'Rust']);
  });
});
