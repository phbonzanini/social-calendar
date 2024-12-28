import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FeedbackButton = () => {
  return (
    <a
      href="https://wa.me/5512982048525?text=Gostaria%20de%20deixar%20um%20feedback%20para%20a%20Social%20Calendar"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50"
    >
      <Button
        className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center gap-2 px-4 py-2"
      >
        <MessageCircle className="h-5 w-5" />
        Feedback
      </Button>
    </a>
  );
};