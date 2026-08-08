// uploadUtils.js

export const validateImageDimensions = (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const isValid = img.width <= 4000 && img.height <= 4000;
            URL.revokeObjectURL(url);
            resolve(isValid);
        };

        img.onerror = () => resolve(false);

        img.src = url;
    });
};

// MAIN VALIDATION + PROCESSING
export const processFile = async (file, options = {}) => {
    const {
        allowedTypes = [],
        maxSizeMB = 5,
    } = options;

    if (!file) {
        return { success: false, error: "No file provided" };
    }

    // Type validation
    if (!allowedTypes.includes(file.type)) {
        return {
            success: false,
            error: "Only SVG, JPG, or PDF allowed"
        };
    }

    // Size validation
    if (file.size > maxSizeMB * 1024 * 1024) {
        return {
            success: false,
            error: `Max file size is ${maxSizeMB}MB`
        };
    }

    // Dimension validation
    const isImage = file.type.startsWith("image/");

    if (isImage) {
        const isValidSize = await validateImageDimensions(file);

        if (!isValidSize) {
            return {
                success: false,
                error: "Image must be max 4000x4000px"
            };
        }
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);

    return {
        success: true,
        file: file,
        fileName: file.name,
        preview: preview,
    };
};

// GET FILE FROM INPUT
export const getFileFromInput = (e) => {
    return e.target.files[0];
};

// GET FILE FROM DRAG DROP
export const getFileFromDrop = (e) => {
    return e.dataTransfer.files[0];
};

// DRAG HANDLERS (PURE UI HELPERS — OPTIONAL)
export const handleDragOver = (e, setIsDragging) => {
    e.preventDefault();
    setIsDragging(true);
};

export const handleDragLeave = (setIsDragging) => {
    setIsDragging(false);
};

export const handleDrop = (e, setIsDragging) => {
    e.preventDefault();
    setIsDragging(false);
    return getFileFromDrop(e);
};