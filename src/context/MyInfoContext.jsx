import { useContext, createContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const MyInfoContext = createContext();

export function MyInfoProvider({ children }) {
  const [info, setInfo] = useLocalStorage("MyInfo", {
    firstName: "Unknown",
    lastName: "Unknown",
    age: "Unknown",
    phone: "Unknown",
    email: "Unknown",
    address: {
      country: "Unknown",
      governorate: "Unknown",
      region: "Unknown",
    },
  });

  const value = {
    info,
    setInfo,
  };

  return (
    <MyInfoContext.Provider value={value}> {children}</MyInfoContext.Provider>
  );
}

export function useMyInfo() {
  const context = useContext(MyInfoContext);
  if (!context) {
    throw new Error("useMyInfo must be used within a MyInfoProvider");
  }
  return context;
}
