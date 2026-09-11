import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "white",
      },
    },
  },
  components : {
    Button : {
      baseStyle : {
        borderRadius : 2
      }
    }
  }
});

export default theme;