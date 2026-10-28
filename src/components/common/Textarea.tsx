import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#2C3831] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#19221D] placeholder:text-[#8FA699] focus:outline-none focus:ring-2 transition-all duration-150 ${
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20 bg-rose-50/20'
                : 'border-[#CCD7D0] hover:border-[#8FA699] focus:border-[#145336] focus:ring-[#145336]/20'
            } ${className}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-[#DC2626] font-medium" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-xs text-[#55665D]">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
