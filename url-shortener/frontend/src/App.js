import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import URLShortener from './components/URLShortener';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="gray.50">
        <Container maxW="container.lg" py={8}>
          <URLShortener />
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
