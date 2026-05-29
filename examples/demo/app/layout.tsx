import { Pixel, PixelPageView } from "next-pixels";
export const metadata = { title: "next-pixels demo" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}<Pixel /><PixelPageView /></body></html>);
}
