"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Input,
  useToast,
  Text,
  Link,
  HStack,
  Stack,
  Image as ChakraImage,
} from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import LoadingIndicator from "@/components/loadingIndicator";
import { auth, db } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [picture, setPicture] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const webcamRef = useRef(null);
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signupComplete, setSignupComplete] = useState(true);
  const inputRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (signupComplete) router.push("/dashboard");
      } else {
        setSignupComplete(false);
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleFileChange = (e) => {
    setPicture(e.target.files[0]);
  };

  const handleCameraCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "capture.png", { type: "image/png" });
        setPicture(file);
        setCameraMode(false);
      });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", email);
      formData.append("image", picture);
      await axios
        .post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/signup`, formData, {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        })
        .then((response) => {
          createUserWithEmailAndPassword(auth, email, password).then(
            async (userCredential) => {
              await setDoc(doc(db, "Users", email), {
                email: email,
                name: name,
                wallet: 5000,
              });
              const user = userCredential.user;
              updateProfile(user, {
                displayName: name,
              }).then(() => {
                setSignupComplete(true);
                toast({
                  title: "Signup successful.",
                  description: "Your account has been created successfully.",
                  status: "success",
                  duration: 5000,
                  isClosable: true,
                });
              });
            }
          );
        });
    } catch (error) {
      setLoading(false);
      toast({
        title: "Signup failed.",
        description: "Please try again.",
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
      <Stack
        spacing={8}
        w="100%"
        justifyContent="center"
        alignItems={"center"}
        flexDirection={{ base: "column", md: "row" }}
      >
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
            Signup
          </Heading>
          <Text fontSize="md" color="gray.400">
            Create a new account.
          </Text>
          <Input
            _hover={{ borderColor: "blue.500" }}
            borderRadius={0}
            borderColor={"#454545"}
            _placeholder={{ color: "gray" }}
            placeholder="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            bg="gray.700"
            color="white"
          />
          <Input
            _hover={{ borderColor: "blue.500" }}
            borderRadius={0}
            borderColor={"#454545"}
            _placeholder={{ color: "gray" }}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            bg="gray.700"
            color="white"
          />
          <Input
            _hover={{ borderColor: "blue.500" }}
            borderRadius={0}
            borderColor={"#454545"}
            _placeholder={{ color: "gray" }}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            bg="gray.700"
            color="white"
          />
          <Button
            onClick={() => {
             
              handleSubmit();
            }}
            colorScheme="blue"
            size="md"
            mt={4}
            isDisabled={
              email.includes("@") &&
              email.includes(".com") &&
              password.length > 7 &&
              picture &&
              name.trim().length != 0
                ? false
                : true
            }
          >
            Signup
          </Button>
          <Text mt={2} color="white">
            Already have an account?{" "}
            <Link _hover={{ color: "blue.300" }} href="/login">
              Login
            </Link>
          </Text>
        </VStack>

        <VStack
          spacing={4}
          boxShadow="2xl"
          p={8}
          bg="gray.800"
          borderRadius="xl"
          w="90%"
          maxW="md"
          textAlign="center"
          mt={8}
          justifyContent={"center"}
        >
          {!cameraMode && (
            <Stack spacing={4} alignItems="center">
              <Text fontSize="sm" color="white">
                Select a picture to upload or use your camera
              </Text>
              <HStack spacing={4}>
                <Button
                  onClick={() => inputRef?.current?.click()}
                  colorScheme="blue"
                  size="md"
                >
                  Select Picture
                </Button>
                <input
                  style={{ display: "none" }}
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
                <Button
                  colorScheme="blue"
                  size="md"
                  onClick={() => setCameraMode(true)}
                >
                  Use Camera
                </Button>
              </HStack>
            </Stack>
          )}

          {cameraMode && (
            <VStack spacing={4} alignItems="center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/png"
                width={320}
                height={240}
                videoConstraints={{ facingMode: "user" }}
              />
              <HStack spacing={4}>
                <Button
                  colorScheme="green"
                  size="md"
                  onClick={handleCameraCapture}
                >
                  Capture
                </Button>
                <Button
                  colorScheme="red"
                  size="md"
                  onClick={() => setCameraMode(false)}
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          )}

          {picture && (
            <Box>
              <Text fontSize="sm" color="white">
                Selected Image:
              </Text>
              <ChakraImage
                src={URL.createObjectURL(picture)}
                alt="Selected"
                boxSize="200px"
                objectFit="cover"
                borderRadius="md"
                mt={2}
              />
            </Box>
          )}
        </VStack>
      </Stack>
      {loading ? <LoadingIndicator /> : null}
    </Box>
  );
}
