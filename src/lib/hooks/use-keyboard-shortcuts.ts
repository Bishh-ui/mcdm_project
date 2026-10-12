/**
 * Global keyboard shortcuts
 */

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useKeyboardShortcuts() {
  const router = useRouter();

  // Navigation shortcuts
  useHotkeys("g d", () => router.push("/dashboard"), { preventDefault: true });
  useHotkeys("g c", () => router.push("/dashboard/criteria"), { preventDefault: true });
  useHotkeys("g t", () => router.push("/dashboard/topsis/run"), { preventDefault: true });
  useHotkeys("g e", () => router.push("/dashboard/experiments"), { preventDefault: true });
  useHotkeys("g w", () => router.push("/dashboard/weights"), { preventDefault: true });
  useHotkeys("g a", () => router.push("/dashboard/audit"), { preventDefault: true });

  // Action shortcuts
  useHotkeys("?", () => {
    toast(
      "Keyboard Shortcuts:\n" +
        "g+d: Dashboard\n" +
        "g+c: Criteria\n" +
        "g+t: TOPSIS\n" +
        "g+e: Experiments\n" +
        "g+w: Weights\n" +
        "g+a: Audit Log\n" +
        "?: Show this help",
      { duration: 8000 }
    );
  });
}
