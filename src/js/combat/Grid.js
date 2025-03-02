import { CONFIG } from './config.js';

export class Grid {
    constructor(size = CONFIG.GRID.SIZE) {
        this.size = size;
        this.cells = [];
        this.draggedOrb = null;
        this.isLocked = false;
        this.onMatchCallback = null;
        this.swapCallback = null;
        
        this.initialize();
    }

    initialize() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        this.cells = [];

        gridElement.style.gridTemplateColumns = `repeat(${this.size}, minmax(0, 1fr))`;
        gridElement.className = 'grid gap-2 bg-gray-800 p-4 rounded-lg mb-4';

        gridElement.addEventListener('dragover', e => e.preventDefault());

        for (let i = 0; i < this.size * this.size; i++) {
            const orb = document.createElement('div');
            const color = this.getRandomColor();
            
            orb.className = `orb w-12 h-12 rounded-full cursor-move ${this.getColorClass(color)}`;
            orb.dataset.color = color;
            orb.dataset.index = i;
            orb.draggable = true;

            this.setupDragEvents(orb);
            gridElement.appendChild(orb);
            this.cells.push(orb);
        }

        while (this.findMatchGroups().length > 0) {
            this.shuffleGrid();
        }
    }

    findMatchGroups() {
        const matches = [];
        const matched = new Set();

        // Check horizontal matches
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size - 2; col++) {
                const startIndex = row * this.size + col;
                if (matched.has(startIndex)) continue;

                const color = this.cells[startIndex].dataset.color;
                let matchSize = 1;
                let nextCol = col + 1;

                // Count consecutive matching orbs
                while (nextCol < this.size && 
                       this.cells[row * this.size + nextCol].dataset.color === color) {
                    matchSize++;
                    nextCol++;
                }

                // If match found (3 or more), record it
                if (matchSize >= 3) {
                    const indices = [];
                    for (let i = 0; i < matchSize; i++) {
                        const index = row * this.size + (col + i);
                        indices.push(index);
                        matched.add(index);
                    }
                    matches.push({ indices, color, size: matchSize });
                    console.log(`Found horizontal match: ${color}, size: ${matchSize}`); // Debug log
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < this.size; col++) {
            for (let row = 0; row < this.size - 2; row++) {
                const startIndex = row * this.size + col;
                if (matched.has(startIndex)) continue;

                const color = this.cells[startIndex].dataset.color;
                let matchSize = 1;
                let nextRow = row + 1;

                // Count consecutive matching orbs
                while (nextRow < this.size && 
                       this.cells[nextRow * this.size + col].dataset.color === color) {
                    matchSize++;
                    nextRow++;
                }

                // If match found (3 or more), record it
                if (matchSize >= 3) {
                    const indices = [];
                    for (let i = 0; i < matchSize; i++) {
                        const index = (row + i) * this.size + col;
                        indices.push(index);
                        matched.add(index);
                    }
                    matches.push({ indices, color, size: matchSize });
                    console.log(`Found vertical match: ${color}, size: ${matchSize}`); // Debug log
                }
            }
        }

        return matches;
    }

    processMatches() {
        const matchGroups = this.findMatchGroups();
        if (matchGroups.length === 0) return false;

        matchGroups.forEach(group => {
            console.log('Processing match:', group); // Debug log
            
            // Notify about match before removing orbs
            if (this.onMatchCallback) {
                console.log('Calling match callback with:', group.color, group.size); // Debug log
                this.onMatchCallback(group.color, group.size);
            } else {
                console.log('No match callback registered'); // Debug log
            }

            // Add match animation
            group.indices.forEach(index => {
                this.cells[index].classList.add('matched');
                
                setTimeout(() => {
                    this.cells[index].classList.remove('matched');
                }, 300);
            });

            // Replace matched orbs with new ones
            group.indices.forEach(index => {
                const color = this.getRandomColor();
                this.cells[index].dataset.color = color;
                this.cells[index].className = `orb w-12 h-12 rounded-full cursor-move ${this.getColorClass(color)}`;
            });
        });

        // Check for new matches after a delay
        setTimeout(() => {
            if (this.findMatchGroups().length > 0) {
                this.processMatches();
            }
        }, 300);

        return true;
    }

    setupDragEvents(orb) {
        orb.addEventListener('dragstart', e => this.handleDragStart(e));
        orb.addEventListener('dragenter', e => this.handleDragEnter(e));
        orb.addEventListener('dragover', e => this.handleDragOver(e));
        orb.addEventListener('dragleave', e => this.handleDragLeave(e));
        orb.addEventListener('drop', e => this.handleDrop(e));
        orb.addEventListener('dragend', e => this.handleDragEnd(e));
    }

    handleDragStart(e) {
        if (this.isLocked) return;
        
        this.draggedOrb = e.target;
        e.target.classList.add('opacity-50');
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target !== this.draggedOrb) {
            e.target.classList.add('ring-2', 'ring-white', 'ring-opacity-50');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragLeave(e) {
        e.target.classList.remove('ring-2', 'ring-white', 'ring-opacity-50');
    }

    handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('ring-2', 'ring-white', 'ring-opacity-50');

        if (this.draggedOrb && this.draggedOrb !== e.target) {
            const target = e.target;
            const draggedIndex = parseInt(this.draggedOrb.dataset.index);
            const targetIndex = parseInt(target.dataset.index);

            if (this.isAdjacent(draggedIndex, targetIndex)) {
                this.swapOrbs(this.draggedOrb, target);
                
                if (this.swapCallback) {
                    this.swapCallback();
                }

                this.processMatches();
            }
        }
    }

    handleDragEnd(e) {
        e.target.classList.remove('opacity-50');
        this.draggedOrb = null;
    }

    getRandomColor() {
        return CONFIG.GRID.COLORS[Math.floor(Math.random() * CONFIG.GRID.COLORS.length)];
    }

    getColorClass(color) {
        return CONFIG.GRID.COLOR_CLASSES[color];
    }

    isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / this.size);
        const col1 = index1 % this.size;
        const row2 = Math.floor(index2 / this.size);
        const col2 = index2 % this.size;

        return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }

    swapOrbs(orb1, orb2) {
        const tempColor = orb1.dataset.color;
        const tempClass = orb1.className;

        orb1.dataset.color = orb2.dataset.color;
        orb1.className = orb2.className;
        
        orb2.dataset.color = tempColor;
        orb2.className = tempClass;
    }

    lock() {
        this.isLocked = true;
        this.cells.forEach(cell => {
            cell.draggable = false;
            cell.classList.add('cursor-not-allowed', 'opacity-75');
        });
    }

    unlock() {
        this.isLocked = false;
        this.cells.forEach(cell => {
            cell.draggable = true;
            cell.classList.remove('cursor-not-allowed', 'opacity-75');
        });
    }

    onMatch(callback) {
        this.onMatchCallback = callback;
        console.log('Match callback registered:', !!callback); // Debug log
    }

    onSwap(callback) {
        this.swapCallback = callback;
    }

    shuffleGrid() {
        // Randomly reassign colors to all orbs
        this.cells.forEach(orb => {
            const newColor = this.getRandomColor();
            orb.dataset.color = newColor;
            orb.className = `orb w-12 h-12 rounded-full cursor-move ${this.getColorClass(newColor)}`;
        });
    }

    enable() {
        this.isLocked = false;
        this.cells.forEach(cell => {
            cell.draggable = true;
            cell.classList.remove('cursor-not-allowed', 'opacity-50');
            cell.classList.add('cursor-move');
        });
    }

    disable() {
        this.isLocked = true;
        this.cells.forEach(cell => {
            cell.draggable = false;
            cell.classList.add('cursor-not-allowed', 'opacity-50');
            cell.classList.remove('cursor-move');
        });
    }
}
