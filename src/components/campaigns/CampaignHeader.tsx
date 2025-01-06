import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CampaignForm } from "./CampaignForm";
import { Campaign } from "@/types/campaign";

interface CampaignHeaderProps {
  onSubmit: (values: Omit<Campaign, "id">) => Promise<void>;
}

export const CampaignHeader = ({ onSubmit }: CampaignHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <h1 className="text-3xl font-bold text-neutral-dark">
          Gerenciar Campanhas
        </h1>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2 bg-white text-neutral-dark hover:bg-neutral-light">
                <Plus className="h-4 w-4" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <CampaignForm onSubmit={onSubmit} />
          </Dialog>
          <Button
            onClick={() => navigate("/calendar")}
            size="sm"
            className="flex items-center gap-2 bg-primary text-white hover:bg-primary-dark"
          >
            <Calendar className="h-4 w-4" />
            Procurar datas sazonais
          </Button>
          <Button
            onClick={() => navigate("/final-calendar")}
            variant="outline"
            size="sm"
            className="text-neutral-dark bg-white hover:text-neutral-dark hover:bg-neutral-light"
          >
            Ver Calendário Final
          </Button>
        </div>
      </div>
    </div>
  );
};