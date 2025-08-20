
// This service is now designed to be called from client-side components.
// It uses the browser's native FormData and fetch APIs.

const USER_HASH = '2a2859051bb86dfe906d0bf6f';
const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

export async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', USER_HASH);
    formData.append('fileToUpload', file); // Use the File object directly, which is a Blob.

    try {
        const response = await fetch(CATBOX_API_URL, {
            method: 'POST',
            body: formData, // The browser will set the correct multipart headers automatically
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Catbox API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseText = await response.text();
        
        // Catbox API returns the direct URL on success
        if (responseText.startsWith('http')) {
            return responseText;
        } else {
            throw new Error(`Catbox upload failed: ${responseText}`);
        }

    } catch (error) {
        console.error('Error uploading to Catbox:', error);
        throw error;
    }
}
