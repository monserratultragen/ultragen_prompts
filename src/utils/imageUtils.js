const CLOUDINARY_BASE = "https://res.cloudinary.com/dxncjhrtt/image/upload/v1/";

export const getImageUrl = (url) => {
    if (!url) return '';

    let cleanUrl = String(url);

    if (cleanUrl.includes('ultragen_media/')) {
        cleanUrl = 'ultragen_media/' + cleanUrl.split('ultragen_media/').pop();
    }
    else if (cleanUrl.includes('/media/')) {
        cleanUrl = cleanUrl.split('/media/').pop();
    }

    if (cleanUrl.startsWith('http')) return cleanUrl;

    if (cleanUrl.startsWith('/dxncjhrtt/')) {
        return `https://res.cloudinary.com${cleanUrl}`;
    }

    if (cleanUrl.startsWith('ultragen_media/')) {
        return `${CLOUDINARY_BASE}${cleanUrl}`;
    }

    return `${import.meta.env.VITE_API_URL}${cleanUrl}`;
};
