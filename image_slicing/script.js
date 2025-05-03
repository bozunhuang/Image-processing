document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileInput = document.getElementById('image');
    const numberInput = document.getElementById('number');
    const numberSlider = document.getElementById('numberSlider');
    const fileDisplay = document.getElementById('fileDisplay');
    const processBtn = document.getElementById('processBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const resultImage = document.getElementById('resultImage');
    const toggleOptionsBtn = document.getElementById('toggleOptions');
    const optionsContent = document.getElementById('optionsContent');
    
    // Event listeners
    processBtn.addEventListener('click', processImage);
    fileInput.addEventListener('change', updateFileDisplay);
    numberInput.addEventListener('input', updateSlider);
    numberSlider.addEventListener('input', updateNumberInput);
    toggleOptionsBtn.addEventListener('click', toggleOptions);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+O: Open file dialog
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            fileInput.click();
        }
        
        // Ctrl+P: Process image
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            processImage();
        }
    });
    
    /**
     * Updates the file display with the name of the selected file
     */
    function updateFileDisplay() {
        if (fileInput.files && fileInput.files.length > 0) {
            fileDisplay.textContent = fileInput.files[0].name;
        } else {
            fileDisplay.textContent = 'No file selected';
        }
    }
    
    /**
     * Updates the slider value when the number input changes
     */
    function updateSlider() {
        numberSlider.value = numberInput.value;
    }
    
    /**
     * Updates the number input when the slider value changes
     */
    function updateNumberInput() {
        numberInput.value = numberSlider.value;
    }
    
    /**
     * Toggles the options panel
     */
    function toggleOptions() {
        const isExpanded = optionsContent.classList.contains('expanded');
        
        if (isExpanded) {
            optionsContent.classList.remove('expanded');
            toggleOptionsBtn.textContent = '+';
        } else {
            optionsContent.classList.add('expanded');
            toggleOptionsBtn.textContent = '-';
        }
    }
    
    /**
     * Main function to process the uploaded image
     */
    function processImage() {
        // Reset UI
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        resultContainer.style.display = 'none';
        
        // Validate inputs
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Please select an image file');
            return;
        }
        
        const file = fileInput.files[0];
        const sliceNumber = parseInt(numberInput.value);
        
        if (isNaN(sliceNumber) || sliceNumber < 2) {
            showError('Number of slices must be at least 2');
            return;
        }
        
        if (sliceNumber % 2 !== 0) {
            showError('Number of slices must be even');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        
        // Read the file and load the image
        const img = new Image();
        const fileReader = new FileReader();
        
        // Set up file reader onload handler
        fileReader.onload = function(e) {
            // Set up image onload handler
            img.onload = function() {
                try {
                    // Process the image
                    const quadImage = quadMerge(img);
                    const slicedImage = slicing(quadImage, sliceNumber);
                    
                    // Display the result
                    resultImage.src = slicedImage.toDataURL();
                    resultContainer.style.display = 'flex';
                } catch (err) {
                    showError('Error processing image: ' + err.message);
                } finally {
                    loadingIndicator.style.display = 'none';
                }
            };
            
            // Set up image error handler
            img.onerror = function() {
                loadingIndicator.style.display = 'none';
                showError('Failed to load image');
            };
            
            // Start loading the image
            img.src = e.target.result;
        };
        
        // Set up file reader error handler
        fileReader.onerror = function() {
            loadingIndicator.style.display = 'none';
            showError('Failed to read file');
        };
        
        // Start reading the file
        fileReader.readAsDataURL(file);
    }
    
    /**
     * Shows an error message to the user
     * @param {string} message - The error message to display
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        loadingIndicator.style.display = 'none';
    }
    
    /**
     * Creates a quad mirror effect by duplicating and flipping the image
     * @param {Image} img - The original image
     * @returns {HTMLCanvasElement} - Canvas with the quad merged image
     */
    function quadMerge(img) {
        const w = img.width * 2;
        const h = img.height * 2;
        
        // Create canvas for the merged image
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        
        // Draw original image in top-left
        ctx.drawImage(img, 0, 0);
        
        // Draw horizontally flipped image in top-right
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        
        // Draw vertically flipped image in bottom-left
        ctx.save();
        ctx.translate(0, h);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        
        // Draw both horizontally and vertically flipped image in bottom-right
        ctx.save();
        ctx.translate(w, h);
        ctx.scale(-1, -1);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        
        return canvas;
    }
    
    /**
     * Slices the image and rearranges the slices
     * @param {HTMLCanvasElement} canvas - The input canvas
     * @param {number} w_slice - Number of horizontal slices (must be even)
     * @returns {HTMLCanvasElement} - Canvas with the sliced image
     */
    function slicing(canvas, w_slice = 30) {
        // Ensure w_slice is even
        if (w_slice % 2 !== 0) {
            throw new Error("The number of slices should be even.");
        }
        
        const w = canvas.width;
        const h = canvas.height;
        const sl_w = Math.floor(w / w_slice);
        
        // Create canvas for intermediate step
        const canvas1 = document.createElement('canvas');
        canvas1.width = w;
        canvas1.height = h;
        const ctx1 = canvas1.getContext('2d');
        
        // Create canvas for final result
        const canvas2 = document.createElement('canvas');
        canvas2.width = w;
        canvas2.height = h;
        const ctx2 = canvas2.getContext('2d');
        
        // Process horizontal slices
        for (let index = 0; index < w_slice / 2; index++) {
            // Extract regions
            const region1 = document.createElement('canvas');
            region1.width = sl_w;
            region1.height = h;
            const ctx_r1 = region1.getContext('2d');
            ctx_r1.drawImage(canvas, index * sl_w, 0, sl_w, h, 0, 0, sl_w, h);
            
            const region2 = document.createElement('canvas');
            region2.width = sl_w;
            region2.height = h;
            const ctx_r2 = region2.getContext('2d');
            ctx_r2.drawImage(canvas, (w_slice - index - 1) * sl_w, 0, sl_w, h, 0, 0, sl_w, h);
            
            // Place regions
            ctx1.drawImage(region1, 2 * index * sl_w, 0);
            ctx1.drawImage(region2, (1 + 2 * index) * sl_w, 0);
        }
        
        // Calculate vertical slice parameters
        const h_slice = Math.floor(w_slice * h / w);
        const sl_h = Math.floor(h / h_slice);
        
        // Process vertical slices
        for (let index = 0; index < h_slice / 2; index++) {
            // Extract regions
            const region1 = document.createElement('canvas');
            region1.width = w;
            region1.height = sl_h;
            const ctx_r1 = region1.getContext('2d');
            ctx_r1.drawImage(canvas1, 0, index * sl_h, w, sl_h, 0, 0, w, sl_h);
            
            const region2 = document.createElement('canvas');
            region2.width = w;
            region2.height = sl_h;
            const ctx_r2 = region2.getContext('2d');
            ctx_r2.drawImage(canvas1, 0, (h_slice - index - 1) * sl_h, w, sl_h, 0, 0, w, sl_h);
            
            // Place regions
            ctx2.drawImage(region1, 0, 2 * index * sl_h);
            ctx2.drawImage(region2, 0, (1 + 2 * index) * sl_h);
        }
        
        return canvas2;
    }
});