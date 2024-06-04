import { LightColorStyles } from './color';

export * from './color';

export const TextStyles = {
  fontFamily: 'sans-serif',
  fontSize: 12,
  fill: LightColorStyles.TextPrimary,
};

export const TextStylesRegular = {
  ...TextStyles,
};

export const HeaderStyles = {
  height: 80,
};

export const GroupStyles = {
  MarginTop: 30,
};

export const ContainerStyles = {
  paddingBottom: 50,
};
