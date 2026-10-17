// Web: the browser's own file picker, one image at a time. The browser-only
// demo has no server to upload to, so it adds photos by URL only.
export const canPickImage = process.env.EXPO_PUBLIC_DEMO !== "1";

export function pickImage(): Promise<Blob | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    // Closing the picker without a file fires "cancel" in current browsers.
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}
