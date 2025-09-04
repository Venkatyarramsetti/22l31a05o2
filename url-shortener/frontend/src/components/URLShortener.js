import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  FormHelperText,
  Divider,
  Card,
  CardBody,
  Stack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from '@chakra-ui/react';

const URLShortener = () => {
  const [formData, setFormData] = useState({
    url: '',
    validity: '30',
    shortcode: '',
  });
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/shorturls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create short URL');
      }

      setResult(data);
      fetchStats(data.shortLink.split('/').pop());
      toast({
        title: 'Success!',
        description: 'Short URL created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (shortcode) => {
    try {
      const response = await fetch(`http://localhost:3000/shorturls/${shortcode}/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Short URL copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="2xl" mb={2}>URL Shortener</Heading>
          <Text color="gray.600">Shorten your long URLs quickly and easily</Text>
        </Box>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Long URL</FormLabel>
                  <Input
                    type="url"
                    placeholder="https://example.com/very/long/url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Validity (minutes)</FormLabel>
                  <Input
                    type="number"
                    value={formData.validity}
                    onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                    min={1}
                    max={1440}
                  />
                  <FormHelperText>Default is 30 minutes</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Custom Shortcode (optional)</FormLabel>
                  <Input
                    placeholder="e.g., mylink123"
                    value={formData.shortcode}
                    onChange={(e) => setFormData({ ...formData, shortcode: e.target.value })}
                    pattern="[A-Za-z0-9]{3,20}"
                  />
                  <FormHelperText>3-20 alphanumeric characters</FormHelperText>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={loading}
                >
                  Shorten URL
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {result && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Your Shortened URL</Heading>
                <InputGroup size="md">
                  <Input
                    pr="4.5rem"
                    value={result.shortLink}
                    isReadOnly
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={() => copyToClipboard(result.shortLink)}>
                      Copy
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <Text color="gray.600">
                  Expires: {new Date(result.expiry).toLocaleString()}
                </Text>
                <Text color="gray.600">
                  Log ID: <Badge>{result.logID}</Badge>
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {stats && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Statistics</Heading>
                <StatGroup>
                  <Stat>
                    <StatLabel>Total Clicks</StatLabel>
                    <StatNumber>{stats.totalClicks}</StatNumber>
                  </Stat>
                </StatGroup>
                <Divider />
                <Box>
                  <Text fontWeight="bold" mb={2}>Recent Clicks</Text>
                  <VStack spacing={2} align="stretch">
                    {stats.clicksData.map((click, index) => (
                      <Box
                        key={index}
                        p={2}
                        bg="gray.50"
                        borderRadius="md"
                        fontSize="sm"
                      >
                        <Text>Time: {new Date(click.clickTimestamp).toLocaleString()}</Text>
                        <Text>Source: {click.sourceReferrer}</Text>
                        <Text>Location: {click.geoLocation}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default URLShortener;
