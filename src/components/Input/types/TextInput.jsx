import React, { forwardRef } from 'react';

export const TextInput = forwardRef(({ value = '', onChange, id, disabled, className, ...rest }, ref) => (
  <input
    ref={ref}
    type="text"
    id={id}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={className}
    {...rest}
  />
));

TextInput.displayName = 'TextInput';
