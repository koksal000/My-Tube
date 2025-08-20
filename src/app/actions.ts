'use server';

const USER_HASH = '2a2859051bb86dfe906d0bf6f';
const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

/**
 * Uploads a file to Catbox.moe using a Server Action.
 * This function is designed to be called from client components.
 * @param formData The FormData object containing the file to upload.
 * @returns The URL of the uploaded file.
 */
export async function uploadFileAction(formData: FormData): Promise<string> {
  // We need to rebuild the FormData for the server context
  const file = formData.get('fileToUpload') as File | null;
  
  if (!file) {
      throw new Error('No file provided.');
  }

  const serverFormData = new FormData();
  serverFormData.append('reqtype', 'fileupload');
  serverFormData.append('userhash', USER_HASH);
  serverFormData.append('fileToUpload', file);

  try {
    const response = await fetch(CATBOX_API_URL, {
      method: 'POST',
      body: serverFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Catbox API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();

    if (responseText.startsWith('http')) {
      return responseText;
    } else {
      throw new Error(`Catbox upload failed: ${responseText}`);
    }
  } catch (error) {
    console.error('Error in uploadFileAction:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }
    throw new Error('An unknown error occurred during file upload.');
  }
}
