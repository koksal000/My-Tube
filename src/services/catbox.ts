// This is a server-side only file
import { Buffer } from 'buffer';
import FormData from 'form-data';


const USER_HASH = '2a2859051bb86dfe906d0bf6f';
const CATBOX_API_URL = 'https://catbox.moe/user/api.php';

export async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', USER_HASH);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    formData.append('fileToUpload', buffer, file.name);

    try {
        const response = await fetch(CATBOX_API_URL, {
            method: 'POST',
            body: formData as any, // FormData type from 'form-data' is compatible
            headers: formData.getHeaders ? formData.getHeaders() : undefined, // Add headers for multipart
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
