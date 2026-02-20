import NucleosTab from "@/features/nucleos/components/NucleosTab";

export default function Nucleos() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Núcleos</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os núcleos e equipes do ministério
        </p>
      </div>

      <NucleosTab />
    </div>
  );
}
