export type SliderChangeEvent = { value: number };

export type SliderProps = {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (event: SliderChangeEvent) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function Slider({ value = 0, min = 0, max = 100, step = 1, onChange, className, style }: SliderProps) {
  return (
    <input
      type="range"
      className={['p-slider', 'p-slider-horizontal', className].filter(Boolean).join(' ')}
      style={style}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange?.({ value: Number(e.target.value) })}
    />
  );
}
