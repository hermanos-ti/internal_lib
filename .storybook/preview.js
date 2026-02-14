import React from 'react';
import '../src/styles/themes.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    layout: 'centered',
    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },
        dark: {
          name: 'dark',
          value: '#333333',
        }
      }
    },
  },

  tags: ['autodocs'],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals?.theme ?? 'light';
      return React.createElement(
        'div',
        { 'data-theme': theme, style: { minHeight: '100dvh', minWidth: 'calc(100dvw - 3rem)' } },
        React.createElement(Story, null)
      );
    },
],
};

export default preview;