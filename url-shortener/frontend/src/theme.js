import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
    Card: {
      baseStyle: {
        p: '20px',
        bg: 'white',
        rounded: 'lg',
        shadow: 'base',
      },
    },
  },
});

export default theme;
