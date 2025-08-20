// This is a server-side only file
import { Buffer } from 'buffer';

const USER_HASH = '2a2859051bb86dfe906d0bf6f';
const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

export async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', USER_HASH);
    
    // Convert File to a format that can be sent in a server-side request
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // FormData in Node's fetch needs Blob, not Buffer directly.
    const blob = new Blob([buffer], { type: file.type });
    formData.append('fileToUpload', blob, file.name);

    try {
        const response = await fetch(CATBOX_API_URL, {
            method: 'POST',
            body: formData,
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
