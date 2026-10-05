import { useContext, createContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const MyInfoContext = createContext();

const DEFAULT_INFO = {
  // ===== Personal =====
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  // ===== Address =====
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  // ===== Access =====
  floor: "",
  apartment: "",
  doorbellName: "",
  hasElevator: "no",
};

export function MyInfoProvider({ children }) {
  const [info, setInfo] = useLocalStorage("MyInfo", DEFAULT_INFO);

  return (
    <MyInfoContext.Provider value={{ info, setInfo }}>
      {children}
    </MyInfoContext.Provider>
  );
}

export function useMyInfo() {
  const context = useContext(MyInfoContext);
  if (!context) {
    throw new Error("useMyInfo must be used within a MyInfoProvider");
  }
  return context;
}