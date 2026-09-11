import React from 'react';
import { Box, Text, VStack, Heading } from '@chakra-ui/react';

const WalletCard = ({ amount }) => {
  return (
    <Box
      bg="gray.800"
      color="white"
      borderRadius="md"
      boxShadow="lg"
      p={6}
      w="full"
      maxW="xs"
    >
      <VStack spacing={4} align="start">
        <Heading size="md" color="teal.300">
          Wallet Balance
        </Heading>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          ${amount.toFixed(2)}
        </Text>
      </VStack>
    </Box>
  );
};

export default WalletCard;
