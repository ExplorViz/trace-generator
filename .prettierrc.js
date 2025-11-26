const config = {
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.{js,ts,jsx,tsx}',
      options: {
        singleQuote: true,
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
  ],
};

export default config;
