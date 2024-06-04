export interface ColorStyles {
  Primary: string;
  PrimaryHover: string;
  PrimaryPressed: string;
  PrimaryLight: string;

  Grey: string;
  GreyLight: string;

  BackgroundPrimary: string;
  BackgroundLight: string;
  BackgroundDark: string;

  Border: string;
  BorderDark: string;

  Error: string;

  TextPrimary: string,
  TextRegular: string,
}

export const LightColorStyles = {
  Primary: 'rgb(66, 108, 236)',
  PrimaryHover: 'rgb(45, 87, 219)',
  PrimaryPressed: 'rgb(34, 74, 210)',
  PrimaryLight: 'rgb(240, 244, 255)',

  Grey: 'rgb(222, 224, 225)',
  GreyLight: 'rgb(100, 106, 115)',

  BackgroundPrimary: '#f5f5f5',
  BackgroundLight: 'rgb(255, 255, 255)',
  BackgroundDark: 'rgb(239, 240, 241)',

  Border: 'rgb(222, 224, 227)',
  BorderDark: 'rgb(187, 187, 187)',

  Error: 'red',

  TextPrimary: '#1f2329',
  TextRegular: '#646a73',
};

export const DarkColorStyles = {
  Primary: 'rgb(76, 135, 255)',
  PrimaryHover: 'rgb(65, 129, 253)',
  PrimaryPressed: 'rgb(34, 74, 210)',
  PrimaryLight: 'rgb(47, 47, 47)',

  Grey: 'rgb(69, 69, 69)',
  GreyLight: 'rgb(125, 125, 125)',

  BackgroundPrimary: 'rgb(37, 37, 37)',
  BackgroundLight: 'rgb(26, 26, 26)',
  BackgroundDark: 'rgb(55, 55, 55)',

  Border: 'rgb(67, 67, 67)',
  BorderDark: 'rgb(187, 187, 187)',

  Error: 'red',

  TextPrimary: '#fff',
  TextRegular: '#646a73',
};
