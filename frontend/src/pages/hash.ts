export const hashText = async (text: string): Promise<string> => {
  // 1. Encode text as a byte array (Uint8Array)
  const msgBuffer = new TextEncoder().encode(text);

  // 2. Hash the message using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // 3. Convert the ArrayBuffer result to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
