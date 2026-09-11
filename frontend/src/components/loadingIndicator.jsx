import { Spinner } from "@chakra-ui/react";

export default function LoadingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        minWidth: "100vw",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        backgroundColor:'#00000079',
      }}
    >
      <Spinner color="orange.300" size={"lg"} />
    </div>
  );
}
