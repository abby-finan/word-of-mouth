"use client";

import { InstallPrompt } from "./InstallPrompt";
import { IosInstallHint } from "./IosInstallHint";

/** Shown on all pages when the app is not installed. */
export function PwaInstallPrompts() {
  return (
    <>
      <InstallPrompt />
      <IosInstallHint />
    </>
  );
}
