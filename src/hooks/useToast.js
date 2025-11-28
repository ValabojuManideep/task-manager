import useAppStore from "../store/useAppStore";

export function useToast() {
  const setToast = useAppStore((s) => s.setToast);
  function toast({ title, description, variant }) {
    setToast({
      show: true,
      title,
      description,
      variant: variant || "info",
    });
  }
  return { toast };
}
