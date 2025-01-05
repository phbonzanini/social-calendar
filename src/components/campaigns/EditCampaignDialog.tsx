import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CampaignForm } from "./CampaignForm";
import { Campaign } from "@/types/campaign";

interface EditCampaignDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onSubmit: (values: Omit<Campaign, "id">) => Promise<void>;
}

export const EditCampaignDialog = ({
  isOpen,
  onOpenChange,
  campaign,
  onSubmit,
}: EditCampaignDialogProps) => {
  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Campanha</DialogTitle>
        </DialogHeader>
        <CampaignForm
          onSubmit={onSubmit}
          defaultValues={{
            nome: campaign.nome,
            data_inicio: campaign.data_inicio,
            data_fim: campaign.data_fim,
            objetivo: campaign.objetivo || "",
            descricao: campaign.descricao || "",
            data_comemorativa: campaign.data_comemorativa || "",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};