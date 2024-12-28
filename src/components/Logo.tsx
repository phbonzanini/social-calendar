import { useNavigate } from "react-router-dom";

export const Logo = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate("/")} 
      className="cursor-pointer hover:opacity-90 transition-opacity"
    >
      <img 
        src="/lovable-uploads/e799ddf2-b654-4728-ae11-71d48fdc363c.png" 
        alt="Social Calendar Logo" 
        className="w-12 h-12 md:w-14 md:h-14"
      />
    </div>
  );
};