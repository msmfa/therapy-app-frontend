const text = {
    // text
    header: 'black',
    body: 'black',

    // buttons normal
    buttonText: 'white',
    buttonBackground: 'black',

    // buttom transparent
    buttonTextTransparent: 'black',
    buttonBackgroundTransparent: 'transparent',

    // modals
    modalBackground: 'white',
    modalBadgeBackground: '#E0E0E0',
    modalBadgeText: 'black',
    modalBadgeBorder: '#C0C0C0',

    // radio buttons active
    radioButtonBorder: '#C0C0C0',
    radioButtonBackground: '#C0C0C0',
    radioButtonDot: 'red',


    // Calendar colors
// apparently 60% is good for sub text that is less important

}

// these are all you should need in pixels for all fonts
const fontSize = {
    header: 24,
    subHeader: 20,
    subHeaderTwo: 18,
    body: 16,
    caption: 14,
}

// should be all we need

// 18px bold, 100% lightness -> headings and key elements
// 16px bold, 100% lightness -> headings and key elements
// 16px regular, 100% lightness -> default body and text size
// 16px regular, 70% lightness -> secondary text
// 14px regular, 70% lightness -> secondary text


// dark mode
// bg-dark = hsl(0 0% 0%)
// bg = hsl(0 0% 5%)
// bg-light = hsl(0 0% 10%)
// text = hsl(0 0% 95%)
// text-muted = hsl(0 0% 70%)
// borders = hsl(0 0% 30%)

// theme/colors.ts

// const hue = {
//   primary: 220,   // Blue
//   secondary: 270, // Purple
//   success: 142,   // Green
//   warning: 38,    // Orange
//   error: 0,       // Red
//   info: 200,      // Cyan
// };

// export const colors = {
//   // Backgrounds
//   bgDark: 'hsl(0, 0%, 90%)',
//   bg: 'hsl(0, 0%, 95%)',
//   bgLight: 'hsl(0, 0%, 100%)',

//   // Text
//   text: 'hsl(0, 0%, 5%)',
//   textMuted: 'hsl(0, 0%, 30%)',

//   // Borders
//   border: 'hsl(0, 0%, 85%)',
//   borderLight: 'hsl(0, 0%, 90%)',

//   // Accent colors
//   primary: `hsl(${hue.primary}, 65%, 55%)`,
//   primaryHover: `hsl(${hue.primary}, 65%, 45%)`,

//   success: `hsl(${hue.success}, 70%, 45%)`,
//   successLight: `hsl(${hue.success}, 70%, 95%)`,

//   warning: `hsl(${hue.warning}, 92%, 50%)`,
//   warningLight: `hsl(${hue.warning}, 92%, 95%)`,

//   error: `hsl(${hue.error}, 84%, 60%)`,
//   errorLight: `hsl(${hue.error}, 84%, 95%)`,
// };

// theme/colors.ts

const hue = {
  primary: 220,   // Blue
  secondary: 270, // Purple
  success: 142,   // Green
  warning: 38,    // Orange
  error: 0,       // Red
  info: 200,      // Cyan
};

export const colors = {
  // Backgrounds
  bgDark: 'hsl(0, 0%, 90%)',
  bg: 'hsl(0, 0%, 95%)',
  bgLight: 'hsl(0, 0%, 100%)',

  // Text
  text: 'hsl(0, 0%, 5%)',        // 100% intensity
  textMuted: 'hsl(0, 0%, 30%)',  // 70% intensity (muted)

  // Borders
  border: 'hsl(0, 0%, 85%)',
  borderLight: 'hsl(0, 0%, 90%)',

  // Accent colors
  primary: `hsl(${hue.primary}, 65%, 55%)`,
  primaryHover: `hsl(${hue.primary}, 65%, 45%)`,

  success: `hsl(${hue.success}, 70%, 45%)`,
  successLight: `hsl(${hue.success}, 70%, 95%)`,

  warning: `hsl(${hue.warning}, 92%, 50%)`,
  warningLight: `hsl(${hue.warning}, 92%, 95%)`,

  error: `hsl(${hue.error}, 84%, 60%)`,
  errorLight: `hsl(${hue.error}, 84%, 95%)`,

};

export const typography = {
  // 18px bold, 100% lightness -> headings and key elements
  h1: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 24,
  },

  // 16px bold, 100% lightness -> headings and key elements
  h2: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 24,
    color: colors.text,
  },

  // 16px regular, 100% lightness -> default body and text size
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text,
  },

  // 16px regular, 70% lightness -> secondary text
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },

  // 14px regular, 70% lightness -> secondary text
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textMuted,
  },
};