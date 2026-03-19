import { useState, useId } from 'react';

const MAX_CHARS = 5000;

const EXAMPLE_CSS = `.container {
  float: left;
  clear: both;
  -webkit-border-radius: 8px;
  -moz-border-radius: 8px;
  border-radius: 8px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  zoom: 1;
}`;

interface Props {
  onSubmit: (css: string) => void;
  isLoading: boolean;
}

export function CssInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('');
  const inputId = useId();
  const hintId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value);
    }
  };

  const handleExample = () => {
    setValue(EXAMPLE_CSS);
  };

  const remaining = MAX_CHARS - value.length;
  const isOverLimit = remaining < 0;
  const isNearLimit = remaining < 200 && !isOverLimit;

  return (
    <form className="css-input-form" onSubmit={handleSubmit} noValidate>
      <div className="css-input-form__field">
        <label htmlFor={inputId} className="css-input-form__label">
          Paste your CSS
        </label>
        <textarea
          id={inputId}
          className="css-input-form__textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/* paste CSS here… */"
          spellCheck={false}
          aria-describedby={hintId}
          aria-invalid={isOverLimit}
          rows={12}
          disabled={isLoading}
        />
        <p
          id={hintId}
          className={`css-input-form__hint ${isOverLimit ? 'css-input-form__hint--error' : isNearLimit ? 'css-input-form__hint--warn' : ''}`}
          aria-live="polite"
        >
          {isOverLimit
            ? `${Math.abs(remaining)} characters over the ${MAX_CHARS.toLocaleString()} character limit`
            : `${remaining.toLocaleString()} characters remaining`}
        </p>
      </div>

      <div className="css-input-form__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleExample}
          disabled={isLoading}
        >
          Load example
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isLoading || isOverLimit || value.trim().length === 0}
          aria-busy={isLoading}
        >
          {isLoading ? 'Analyzing…' : 'Analyze CSS'}
        </button>
      </div>
    </form>
  );
}
