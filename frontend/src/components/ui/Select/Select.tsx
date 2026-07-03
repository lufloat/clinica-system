type Option = {
  value: string | number;
  label: string;
};

type SelectProps = {
  label: string;
  name: string;
  value: string | number;
  options: Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

import "./Select.css";

function Select({
  label,
  name,
  value,
  options,
  onChange,
}: SelectProps) {
  return (
    <div className="select-group">

      <label>{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
      >

        <option value="">
          Selecione...
        </option>

        {options.map(option => (

          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>

        ))}

      </select>

    </div>
  );
}

export default Select;