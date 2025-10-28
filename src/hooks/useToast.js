export function useToast() {
  function toast({ title, description, variant }) {
    alert(`${title}: ${description}`);
  }

  return { toast };
}
