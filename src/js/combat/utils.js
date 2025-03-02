// Utility functions
export const utils = {
    /**
     * Generate a random integer between min and max (inclusive)
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    /**
     * Sleep for specified milliseconds
     * @param {number} ms 
     * @returns {Promise}
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Deep clone an object
     * @param {Object} obj 
     * @returns {Object}
     */
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    /**
     * Format a number with commas
     * @param {number} num 
     * @returns {string}
     */
    formatNumber: (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),

    /**
     * Get the complementary color for a background to ensure text readability
     * @param {string} color 
     * @returns {string} 'text-white' or 'text-black'
     */
    getTextColorClass: (color) => {
        const darkColors = ['red', 'blue', 'purple'];
        return darkColors.includes(color) ? 'text-white' : 'text-black';
    },

    /**
     * Format a percentage into a string
     * @param {number} value 
     * @returns {string}
     */
    formatPercentage: (value) => `${Math.floor(value)}%`
};
