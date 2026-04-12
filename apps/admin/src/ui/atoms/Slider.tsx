import { Slider as PrimeSlider } from 'primereact/slider';
import type { SliderProps as PrimeSliderProps, SliderChangeEvent } from 'primereact/slider';

export type { SliderChangeEvent };

export type SliderProps = Pick<PrimeSliderProps, 'value' | 'min' | 'max' | 'step' | 'onChange' | 'className' | 'style'>;

export function Slider(props: SliderProps) {
  return <PrimeSlider {...props} />;
}
