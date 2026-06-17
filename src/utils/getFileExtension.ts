export function getFileExtension(fileName = "") {
    const normalizedFileName = fileName.toLowerCase().trim();
    const parts = normalizedFileName.split(".");

    return parts.length > 1 ? parts.pop() : "";
}