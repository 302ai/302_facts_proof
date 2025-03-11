import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useIsHideBrand } from "@/hooks/global/use-is-hide-brand";

export default function OpenSource() {
  const isHideBrand = useIsHideBrand();
  if (isHideBrand) return null;
  return (
    <Button
      variant="icon"
      size="roundIconSm"
      onClick={() => window.open('https://github.com/302ai/302_prompt_expert')}
    >
      <FaGithub className="size-4" />
    </Button>
  );
}
