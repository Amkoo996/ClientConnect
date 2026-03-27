import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface BaseProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] };

const Label = ({ text, required }: { text?: string; required?: boolean }) => {
  if (!text) return null;
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );
};

const ErrorHint = ({ error, hint }: { error?: string; hint?: string }) => {
  if (error) return <p className="mt-1 text-sm text-red-600">{error}</p>;
  if (hint) return <p className="mt-1 text-sm text-gray-500">{hint}</p>;
  return null;
};

const baseInputStyles = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        <Label text={label} required={required} />
        <input
          ref={ref}
          className={`${baseInputStyles} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        <ErrorHint error={error} hint={hint} />
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        <Label text={label} required={required} />
        <textarea
          ref={ref}
          className={`${baseInputStyles} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        <ErrorHint error={error} hint={hint} />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        <Label text={label} required={required} />
        <select
          ref={ref}
          className={`${baseInputStyles} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ErrorHint error={error} hint={hint} />
      </div>
    );
  }
);
Select.displayName = 'Select';
