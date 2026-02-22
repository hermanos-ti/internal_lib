import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { DateInput } from './DateInput';
import { PasswordInput } from './PasswordInput';
import { SelectInput } from './SelectInput';
import { TextareaInput } from './TextareaInput';
import { SwitchInput } from './SwitchInput';
import { CheckboxInput } from './CheckboxInput';
import { RadioGroupInput } from './RadioGroupInput';
import { FileInput } from './FileInput';
import { SliderInput } from './SliderInput';
import { ColorInput } from './ColorInput';

const DATE_TYPES = [
  'date', 'data', 'data-curto', 'data-extenso', 'data-extenso-curto',
  'dia-mes', 'dia-mes-extenso', 'dia-mes-extenso-curto',
  'mes-ano', 'mes-ano-extenso', 'mes-ano-extenso-curto',
  'data-hora', 'data-hora-extenso', 'data-hora-extenso-curto', 'hora',
];

const typeMap = {
  text: TextInput,
  number: NumberInput,
  date: DateInput,
  data: DateInput,
  'data-curto': DateInput,
  'data-extenso': DateInput,
  'data-extenso-curto': DateInput,
  'dia-mes': DateInput,
  'dia-mes-extenso': DateInput,
  'dia-mes-extenso-curto': DateInput,
  'mes-ano': DateInput,
  'mes-ano-extenso': DateInput,
  'mes-ano-extenso-curto': DateInput,
  'data-hora': DateInput,
  'data-hora-extenso': DateInput,
  'data-hora-extenso-curto': DateInput,
  hora: DateInput,
  password: PasswordInput,
  select: SelectInput,
  textarea: TextareaInput,
  switch: SwitchInput,
  checkbox: CheckboxInput,
  radio: RadioGroupInput,
  'radio group': RadioGroupInput,
  file: FileInput,
  slider: SliderInput,
  color: ColorInput,
};

export function getInputByType(type) {
  const normalized = String(type || 'text').toLowerCase();
  return typeMap[normalized] || TextInput;
}

export function isDateType(type) {
  return DATE_TYPES.includes(String(type || '').toLowerCase());
}

export {
  TextInput,
  NumberInput,
  DateInput,
  PasswordInput,
  SelectInput,
  TextareaInput,
  SwitchInput,
  CheckboxInput,
  RadioGroupInput,
  FileInput,
  SliderInput,
  ColorInput,
};
