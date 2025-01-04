import { Loader2 } from "lucide-react";

export const LoadingState = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
    <div className="text-center max-w-md px-4">
      <h3 className="text-lg font-semibold mb-2">Analisando datas relevantes</h3>
      <p className="text-muted-foreground">
        Estamos buscando as datas mais relevantes para os nichos selecionados. 
        Isso pode levar alguns segundos...
      </p>
    </div>
  </div>
);