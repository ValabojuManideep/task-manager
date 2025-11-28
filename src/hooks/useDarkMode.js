import useAppStore from "../store/useAppStore";

export const useDarkMode = () => {
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  return [darkMode, setDarkMode];
};
