"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Input,
  useToast,
  Text,
  HStack,
} from "@chakra-ui/react";
import axios from "axios";
import { Link } from "@chakra-ui/next-js";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import LoadingIndicator from "@/components/loadingIndicator";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    try {
      await signInWithEmailAndPassword(auth, email, password).then(() => {
        toast({
          title: "Login successful.",
          description: "You have logged in successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Login failed.",
        description: "Please check your credentials and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      display="flex"
      alignItems="center"
      bg="gray.900"
      flexDir={"column"}
    >
      <HStack w="100%" justifyContent="flex-end" p={4}>
        <Button colorScheme="blue" size="sm" onClick={() => router.push("/")}>
          Home
        </Button>
      </HStack>
      <VStack
        spacing={8}
        boxShadow="2xl"
        p={8}
        bg="gray.800"
        borderRadius="xl"
        w="90%"
        maxW="md"
        textAlign="center"
        mt={8}
      >
        <Heading size="lg" color="orange.300">
          Login
        </Heading>
        <Text fontSize="md" color="gray.400">
          Enter your credentials to access your account.
        </Text>
        <Input
          _hover={{ borderColor: "blue.500" }}
          _placeholder={{color : 'gray'}}
          borderRadius={0}
          borderColor={"#454545"}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          bg="gray.700"
          color="white"
        />
        <Input
          _hover={{ borderColor: "blue.500" }}
          _placeholder={{color : 'gray'}}
          borderRadius={0}
          borderColor={"#454545"}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          bg="gray.700"
          color="white"
        />
        <Button
          onClick={()=>{
            setLoading(true)
            handleSubmit()
          }}
          colorScheme="blue"
          size="md"
          isDisabled={
            email.includes("@") && email.includes(".com") && password.length > 7
              ? false
              : true
          }
        >
          Login
        </Button>
        <div style={{ display: "flex" }}>
          <Text>{`Don't have an account?`}</Text>
          <Link _hover={{ color: "blue.300" }} ml={"5px"} href={"/signup"}>
            {" "}
            SignUp
          </Link>
        </div>
      </VStack>
      {loading ? <LoadingIndicator /> : null}
    </Box>
  );
}
