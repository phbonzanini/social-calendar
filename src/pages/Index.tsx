import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Logo } from "@/components/Logo";

const Index = () => {
  return (
    <div className="relative">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
      <WelcomeScreen />
    </div>
  );
};

export default Index;