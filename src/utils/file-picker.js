/**
 * file-picker.js — Cross-browser file picking utilities
 * Falls back to <input type="file"> when File System Access API is unavailable
 */

/**
 * Pick one or more files with optional type filter
 * @param {Object} options
 * @param {string} options.accept - Accept string, e.g. '.wav,.ogg' or 'image/png'
 * @param {boolean} options.multiple - Allow multiple files
 * @returns {Promise<File[]>}
 */
export function pickFiles({ accept = '', multiple = false } = {}) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', () => {
            const files = Array.from(input.files);
            document.body.removeChild(input);
            if (files.length === 0) {
                reject(new DOMException('No file selected', 'AbortError'));
            } else {
                resolve(files);
            }
        });

        input.addEventListener('cancel', () => {
            document.body.removeChild(input);
            reject(new DOMException('User cancelled', 'AbortError'));
        });

        // Fallback: if no change/cancel event fires after click
        const onFocus = () => {
            setTimeout(() => {
                if (input.parentNode) {
                    document.body.removeChild(input);
                    reject(new DOMException('User cancelled', 'AbortError'));
                }
            }, 300);
            window.removeEventListener('focus', onFocus);
        };

        input.click();

        // Only add focus listener after a delay to avoid premature firing
        setTimeout(() => {
            window.addEventListener('focus', onFocus);
        }, 500);
    });
}

/**
 * Pick a single audio file (.wav, .ogg)
 * @returns {Promise<File>}
 */
export async function pickAudioFile() {
    const files = await pickFiles({ accept: '.wav,.ogg,audio/wav,audio/ogg' });
    return files[0];
}

/**
 * Pick a single image file (.png, .jpg)
 * @returns {Promise<File>}
 */
export async function pickImageFile() {
    const files = await pickFiles({ accept: '.png,.jpg,.jpeg,image/png,image/jpeg' });
    return files[0];
}

/**
 * Pick a single text file (.txt)
 * @returns {Promise<File>}
 */
export async function pickTextFile() {
    const files = await pickFiles({ accept: '.txt,text/plain' });
    return files[0];
}

/**
 * Pick a single JSON file
 * @returns {Promise<File>}
 */
export async function pickJsonFile() {
    const files = await pickFiles({ accept: '.json,application/json' });
    return files[0];
}

/**
 * Download content as a file (replaces showSaveFilePicker)
 * @param {string} filename
 * @param {string|Blob} content
 * @param {string} [mimeType]
 */
export function downloadFile(filename, content, mimeType = 'application/octet-stream') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
