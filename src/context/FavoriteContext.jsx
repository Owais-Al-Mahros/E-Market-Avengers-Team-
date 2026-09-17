import { useContext, createContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const [favorite, setFavorite] = useLocalStorage("favorite-list", []);

  const toggleFavorite = (product) => {
    setFavorite((prev) => {
      const isExist = prev.some((item) => item.id === product.id);
      if (isExist) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isFavorite = (productId) => {
    return favorite.some((item) => item.id === productId);
  };

  const value = {
    favorite,
    toggleFavorite,
    isFavorite,
  };
  return (
    <FavoriteContext.Provider value={value}>
      {" "}
      {children}
    </FavoriteContext.Provider>
  );
}
export function useFavorite() {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorite must be used within a FavoriteProvider");
  }
  return context;
}
