export default function Select({
  name,
  value,
  onChange,
  label,
  children,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
      >
        {children}
      </select>
    </div>
  );
}
