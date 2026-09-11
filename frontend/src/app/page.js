"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  HStack,
  Select,
  useToast,
  Image as ChakraImage,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import moment from "moment";
import LoadingIndicator from "@/components/loadingIndicator";
import { auth, db } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  addDoc,
  updateDoc,
} from "firebase/firestore";

export default function Home() {
  const [picture, setPicture] = useState(null);
  const [cameraMode, setCameraMode] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const webcamRef = useRef(null);
  const toast = useToast();
  const router = useRouter();

  // Function to fetch connected cameras
  async function getConnectedCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      // Map cameras to labels A-Z
      return videoDevices.map((device, index) => ({
        label: String.fromCharCode(65 + index), // A, B, C, ...
        deviceId: device.deviceId,
      }));
    } catch (error) {
      console.error("Error accessing devices:", error);
      return [];
    }
  }

  // Fetch cameras on component mount
  useEffect(() => {
    getConnectedCameras().then((fetchedCameras) => {
      setCameras(fetchedCameras);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedIn(true);
        setCameraMode(true);
      } else {
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const calculateFare = (from, to) => {
    const cameras = [from, to].sort();
    const cameraPair = `${cameras[0]}_${cameras[1]}`;
    const fareMapping = {
      "A_B": parseFloat(process.env.NEXT_PUBLIC_CAMERA_A_B_FARE || "0"),
      "A_C": parseFloat(process.env.NEXT_PUBLIC_CAMERA_A_C_FARE || "0"),
      "B_C": parseFloat(process.env.NEXT_PUBLIC_CAMERA_B_C_FARE || "0"),
    };
    return fareMapping[cameraPair] || 0;
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
      formData.append("image", picture);
      formData.append("camera", selectedCamera);
      let list = []
      let wallet = 0

      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/verify`, formData)
        .then(async (response) => {
          if (response.data.username) {
            await getDocs(query(collection(db, 'Data'), where('email', '==', response.data.username), limit(1), orderBy("timestamp", "desc")))
              .then((snaphshot) => {
                snaphshot.forEach((docs) => {
                  list.push({ ...docs.data(), id: docs.id })
                })
              })
            if (list.length == 0) {
              await addDoc(collection(db, 'Data'), {
                email: response.data.username,
                timestamp: moment().valueOf(),
                start: selectedCamera
              })
                .then(() => {
                  toast({
                    title: "Submitted.",
                    description: "Image verified.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                  });

                })
            } else {
              if (list[0].end) {
                await addDoc(collection(db, 'Data'), {
                  email: response.data.username,
                  timestamp: moment().valueOf(),
                  start: selectedCamera
                })
                  .then(() => {
                    toast({
                      title: "Submitted.",
                      description: "Image verified.",
                      status: "success",
                      duration: 5000,
                      isClosable: true,
                    });

                  })
              } else {
                const fare = calculateFare(list[0].start, selectedCamera);
                await updateDoc(doc(db, 'Data', list[0].id), {
                  end: selectedCamera,
                  fare: fare
                }).then(async () => {
                  await getDoc(doc(db, 'Users', response.data.username))
                    .then(async (docs) => {
                      wallet = docs.data().wallet
                      wallet = wallet - fare
                      await updateDoc(doc(db, 'Users', response.data.username), {
                        wallet: wallet
                      })
                        .then(() => {
                          toast({
                            title: "Submitted.",
                            description: "Image verified.",
                            status: "success",
                            duration: 5000,
                            isClosable: true,
                          });
                          if (wallet < 10) {
                            toast({
                              title: "Low balance.",
                              description: "Kindly recharge your account.",
                              status: "error",
                              duration: 5000,
                              isClosable: true,
                            });
                          }
                        })
                    })
                })
              }
            }

          }
          if (response.data.message) {
            toast({
              title: "Error.",
              description: "Image not verified.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }

        })

    } catch (error) {
      console.log(error)
      toast({
        title: "Submission failed.",
        description: "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setSelectedCamera("");
      setPicture(null);
    }
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      display="flex"
      flexDirection="column"
      bg="gray.900"
      bgImage="/image4.jpg"
      bgRepeat="no-repeat"
      bgSize="cover"
      bgPosition="center"
      alignItems="center"
    >
      <HStack w="100%" justifyContent="flex-end" p={4}>
        {loggedIn ? (
          <Button colorScheme="blue" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        ) : (
          <Button colorScheme="blue" size="sm" onClick={() => router.push("/login")}>
            Login
          </Button>
        )}

        <Button colorScheme="blue" size="sm" onClick={() => router.push("/signup")}>
          Signup
        </Button>
      </HStack>

      <VStack
        spacing={6}
        boxShadow="lg"
        p={8}
        bg="rgba(0, 0, 0, 0.6)"
        borderRadius="xl"
        w="90%"
        maxW="lg"
        textAlign="center"
        alignSelf="center"
      >
        <Heading size="lg" color="orange.300">
          Railway Tracking System
        </Heading>
        <Text fontSize="md" color="gray.400">
          A modern way to track fares using facial recognition.
        </Text>

        {cameraMode && (
          <VStack spacing={4} alignItems="center">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              width={320}
              height={240}
              videoConstraints={{
                deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
              }}
            />
            <Select
              bg={"transparent"}
              color={"white"}
              w={"200px"}
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
            >
              <option style={{ color: "black" }} value="">
                Select Camera
              </option>
              {cameras.map((camera) => (
                <option
                  key={camera.deviceId}
                  style={{ color: "black" }}
                  value={camera.deviceId}
                >
                  {camera.label}
                </option>
              ))}
            </Select>
            <HStack spacing={4}>
              <Button colorScheme="green" size="md" onClick={handleCameraCapture}>
                Capture
              </Button>
              <Button colorScheme="red" size="md" onClick={() => setCameraMode(false)}>
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

        <Button
          onClick={handleSubmit}
          colorScheme="blue"
          size="md"
          isDisabled={!picture || !selectedCamera}
        >
          Submit
        </Button>
      </VStack>

      {loading ? <LoadingIndicator /> : null}
    </Box>
  );
}
