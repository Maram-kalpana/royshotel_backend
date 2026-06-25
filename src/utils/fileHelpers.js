/**
 * Converts a File or Blob to a Base64 data URL string.
 * Safe to store in a database and use as an <img src>.
 */
export const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)   // "data:image/jpeg;base64,..."
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })