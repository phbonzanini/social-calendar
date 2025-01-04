import { NavigateFunction } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const STORAGE_KEY = "selectedNiches";

export const getNiches = (
  locationState: any, 
  navigate: NavigateFunction
): string[] => {
  if (locationState?.selectedNiches) {
    localStorage.setItem(
      STORAGE_KEY, 
      JSON.stringify(locationState.selectedNiches)
    );
    return locationState.selectedNiches;
  }
  
  const storedNiches = localStorage.getItem(STORAGE_KEY);
  if (storedNiches) {
    return JSON.parse(storedNiches);
  }
  
  navigate("/select-niche");
  return [];
};