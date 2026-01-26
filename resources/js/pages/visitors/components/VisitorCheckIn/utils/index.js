/**
 * Capitalizes the first letter of each word without changing the rest
 * Example: "john doe" -> "John Doe", "IBM" -> "IBM", "mcdonald" -> "Mcdonald"
 */
export const toTitleCase = (text) => {
    if (!text) return text;
    return text
        .split(' ')
        .map(word => {
            if (!word) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};
