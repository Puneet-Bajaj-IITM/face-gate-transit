"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  ChakraProvider,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { useRouter } from "next/navigation";
import LoadingIndicator from "@/components/loadingIndicator";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import WalletCard from "@/components/wallet";

export default function Dashboard() {
  const [userData, setUserData] = useState([]);
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [walletAmount, setWalletAmount] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmail(user.email);
      } else {
        router.push("/");
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (email) {
      fetchUserData();
    }
  }, [email]);

  async function fetchUserData() {
    try {
      let list = [];
      
      await getDoc(doc(db, 'Users', email))
      .then((docs)=>{
        setWalletAmount(docs.data().wallet)
      })

      await getDocs(
        query(collection(db, "Data"), where("email", "==", email))
      ).then((snapshot) => {
        snapshot.forEach((docs) => {
          list.push(docs.data());
        });
      });
      const sortedData = list.sort((a, b) => a.timeStamp - b.timeStamp);
      
      setUserData(sortedData.reverse());
    } catch (error) {
      toast({
        title: "Failed to fetch data.",
        description: "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    signOut(auth).then(() => {
      router.push("/");
    });
  }

  return (
    <Box
      w="100%"
      minH="100vh"
      display="flex"
      flexDir="column"
      alignItems="center"
      bg="gray.900"
    >
      <HStack w="100%" justifyContent="flex-end" p={4} spacing={4}>
        <Button colorScheme="blue" size="sm" onClick={() => router.push("/")}>
          Home
        </Button>
        <Button colorScheme="blue" size="sm" onClick={() => handleLogout()}>
          Logout
        </Button>
      </HStack>
      <Stack alignItems={'flex-end'} width={'100%'} px={4} mb={5}>
      <WalletCard amount={walletAmount} />
      </Stack>
      <VStack
        spacing={8}
        boxShadow="2xl"
        p={8}
        bg="gray.800"
        borderRadius="xl"
        w={{ sm: "100%", md: "90%", lg: "80%" }}
        textAlign="center"
        overflowX={"auto"}
      >

        <Heading size="lg" color="orange.300">
          Dashboard
        </Heading>
        <Table variant="simple" colorScheme="teal" size="md" minWidth={"100%"}>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Boarding</Th>
              <Th>Destination</Th>
              <Th>Fare</Th>
            </Tr>
          </Thead>
          <Tbody>
            {userData.map((user, index) => (
              <Tr key={index}>
                <Td>{moment(user.timestamp).format("LL")}</Td>
                <Td>{user.start}</Td>
                <Td>{user?.end || ""}</Td>
                <Td>{user?.fare || ""}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
      {loading && <LoadingIndicator />}
    </Box>
  );
}
