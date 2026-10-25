import { InfinityLoader } from "@/components/ui/loader-13";

export default function InfinityLoaderDemo() {
  return (
    <div className="flex min-h-[250px] w-full items-center justify-center bg-background p-4">
      <InfinityLoader 
        size={200} 
        // Change the color by passing any Tailwind stroke utility class here.
        // Examples: "[&>svg>path:last-child]:stroke-sky-500"
        //           "[&>svg>path:last-child]:stroke-amber-500"
        className="[&>svg>path:last-child]:stroke-destructive" 
      />
    </div>
  );
}
