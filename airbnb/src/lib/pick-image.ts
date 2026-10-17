// Picking a photo file for upload. Only web has a file picker without adding
// a native module; on iOS and Android the admin adds photos by URL.
export const canPickImage = false;
export const pickImage = async (): Promise<Blob | null> => null;
