import localFont from "next/font/local";

/** Cubao Free Wide — display font for WOM background typography */
export const cubao = localFont({
  src: "../../../public/fonts/Cubao-Free-Wide.otf",
  variable: "--font-cubao",
  display: "swap",
  weight: "400",
  preload: true,
});
