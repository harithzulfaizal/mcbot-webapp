type PromptCardProps = {
  title: string;
  description: string;
  onClick: () => void;
};

function PromptCard({ title, description, onClick }: PromptCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start text-left rounded-xl border px-4 py-3 shadow-sm hover:shadow-md transition w-full sm:w-auto sm:min-w-[220px] bg-white"
    >
      <span className="font-semibold text-sm text-foreground">{title}</span>
      <span className="text-muted-foreground text-sm mt-1">{description}</span>
    </button>
  );
}

export function PromptCards({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  const prompts = [
    {
      title: "Cases related to SPGK",
      description: "Find me cases that are related to SPGK Pte Ltd",
    },
    {
      title: "Decode acronyms",
      description: "What does LLM stand for?",
    },
    {
      title: "Start your research",
      description: "How have world literacy rates change?",
    },
    {
      title: "Past custody case",
      description: "Has there been any past case related to custody?",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 px-4 pb-4">
      {prompts.map((item, idx) => (
        <PromptCard
          key={idx}
          title={item.title}
          description={item.description}
          onClick={() => onSelect(item.description)}
        />
      ))}
    </div>
  );
}
