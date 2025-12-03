
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('life-grid');
    if (!gridContainer) console.error('Grid container not found!');

    const resetBtn = document.getElementById('reset-btn');
    const TOTAL_YEARS = 95;
    const WEEKS_PER_YEAR = 52;
    const STORAGE_KEY = 'life_event_visualizer_data';
    const BIRTH_YEAR_KEY = 'life_event_visualizer_birth_year';
    const tooltip = document.getElementById('tooltip');
    const birthYearInput = document.getElementById('birth-year');

    // Vibrant Pastel Palette (Bright but readable)
    const PALETTE = [
        '#ff6b6b', // Pastel Red
        '#feca57', // Pastel Orange
        '#48dbfb', // Pastel Blue
        '#ff9ff3', // Pastel Pink
        '#54a0ff', // Electric Blue
        '#1dd1a1', // Wild Caribbean Green
        '#f368e0', // Amour (Magenta)
        '#00d2d3', // Jade Dust (Teal)
        '#9c88ff', // Pastel Purple
        '#ff9f43', // Double Dragon Skin (Orange)
        '#8395a7', // Muted Blue Grey
        '#22a6b3', // Mandy (Darker Teal)
        '#ee5253', // Armor Red
        '#0abde3', // Cyan
        '#10ac84'  // Mountain Meadow
    ];

    // Load saved data
    let lastGeneratedColor = null;
    let markedBlocks = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    let birthYear = parseInt(localStorage.getItem(BIRTH_YEAR_KEY)) || new Date().getFullYear();

    // Initialize input
    birthYearInput.value = birthYear;

    birthYearInput.addEventListener('change', (e) => {
        birthYear = parseInt(e.target.value);
        localStorage.setItem(BIRTH_YEAR_KEY, birthYear);
        renderGrid();
    });

    // Default milestones
    const DEFAULT_EVENTS = {
        '0-0': "Born",
        '5-35': "Elementary School",
        '18-35': "Starting College",
        '22-20': "Graduated College"
    };

    // Apply defaults if no data exists
    if (!markedBlocks || Object.keys(markedBlocks).length === 0) {
        markedBlocks = {};
        for (const [key, text] of Object.entries(DEFAULT_EVENTS)) {
            markedBlocks[key] = {
                text: text,
                color: getRandomColor()
            };
        }
        saveState();
    }

    // Migration from old Set format if necessary (even older format)
    if (Array.isArray(markedBlocks)) {
        const newStore = {};
        markedBlocks.forEach(id => newStore[id] = "Marked Event");
        markedBlocks = newStore;
        saveState();
    }

    // Migration: Convert old string format to object format
    for (let key in markedBlocks) {
        if (typeof markedBlocks[key] === 'string') {
            markedBlocks[key] = {
                text: markedBlocks[key],
                color: getRandomColor()
            };
        }
    }
    saveState(); // Save migrated data immediately



    function getRandomColor() {
        let color;
        let attempts = 0;
        do {
            color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            attempts++;
        } while (color === lastGeneratedColor && attempts < 5);

        lastGeneratedColor = color;
        return color;
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(markedBlocks));
    }

    function toggleBlock(year, week, blockElement) {
        const blockId = `${year}-${week}`;
        const currentData = markedBlocks[blockId];
        const currentText = currentData ? currentData.text : '';

        let newText = prompt("Enter event description (leave empty to unmark):", currentText);

        if (newText === null) return; // Cancelled

        if (newText.trim() === '') {
            // Unmark
            if (markedBlocks[blockId]) {
                delete markedBlocks[blockId];
            }
        } else {
            // Mark or Update
            // Keep existing color if updating, otherwise pick new random color
            const color = currentData ? currentData.color : getRandomColor();
            markedBlocks[blockId] = {
                text: newText.trim(),
                color: color
            };
        }
        saveState();
        renderGrid(); // Re-render entire grid to update eras
    }

    function getMonthName(weekIndex) {
        const monthIndex = Math.floor((weekIndex / WEEKS_PER_YEAR) * 12);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[Math.min(monthIndex, 11)];
    }

    function showTooltip(e, content) {
        tooltip.innerHTML = content; // Changed to innerHTML for formatting
        tooltip.classList.remove('hidden');
        updateTooltipPosition(e);
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }

    function updateTooltipPosition(e) {
        if (tooltip.classList.contains('hidden')) return;
        tooltip.style.left = `${e.pageX}px`;
        tooltip.style.top = `${e.pageY}px`;
    }

    const viewWeeksBtn = document.getElementById('view-weeks');
    const viewMonthsBtn = document.getElementById('view-months');
    const viewYearsBtn = document.getElementById('view-years');
    const headerTitle = document.querySelector('header h1');
    const headerDesc = document.querySelector('header p');

    let currentView = 'weeks'; // 'weeks', 'months', or 'years'

    // View Toggle Listeners
    viewWeeksBtn.addEventListener('change', () => {
        if (viewWeeksBtn.checked) {
            currentView = 'weeks';
            headerTitle.textContent = "Life in Weeks";
            headerDesc.textContent = "Each block represents one week of your life. Mark your significant events.";
            renderGrid();
        }
    });

    viewMonthsBtn.addEventListener('change', () => {
        if (viewMonthsBtn.checked) {
            currentView = 'months';
            headerTitle.textContent = "Life in Months";
            headerDesc.textContent = "Each block represents one month of your life. Mark your significant events.";
            renderGrid();
        }
    });

    viewYearsBtn.addEventListener('change', () => {
        if (viewYearsBtn.checked) {
            currentView = 'years';
            headerTitle.textContent = "Life in Years";
            headerDesc.textContent = "Each block represents one year of your life. Mark your significant events.";
            renderGrid();
        }
    });

    // --- Drag and Drop Handlers (Delegated) ---

    gridContainer.addEventListener('dragstart', (e) => {
        const target = e.target;
        // Allow dragging if it's a block with event-start OR an event-label
        if (target.classList.contains('event-start') || target.classList.contains('event-label')) {
            const block = target.closest('.block');
            if (block) {
                const id = block.dataset.sourceId || block.dataset.blockId;
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'move';
                block.style.opacity = '0.5';
                block.classList.add('dragging');
            }
        } else {
            e.preventDefault(); // Prevent dragging other things
        }
    });

    gridContainer.addEventListener('dragend', (e) => {
        const block = e.target.closest('.block');
        if (block) {
            block.style.opacity = '1';
            block.classList.remove('dragging');
        }
        document.querySelectorAll('.block.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    gridContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        const block = e.target.closest('.block');
        if (block && !block.classList.contains('dragging')) {
            e.dataTransfer.dropEffect = 'move';
            block.classList.add('drag-over');
            // Remove drag-over from others to prevent sticky highlights
            document.querySelectorAll('.block.drag-over').forEach(el => {
                if (el !== block) el.classList.remove('drag-over');
            });
        }
    });

    gridContainer.addEventListener('dragleave', (e) => {
        const block = e.target.closest('.block');
        if (block) {
            block.classList.remove('drag-over');
        }
    });

    gridContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetBlock = e.target.closest('.block');

        // Cleanup highlights
        document.querySelectorAll('.block.drag-over').forEach(el => el.classList.remove('drag-over'));

        if (!targetBlock) return;

        const sourceId = e.dataTransfer.getData('text/plain');
        const targetId = targetBlock.dataset.blockId;

        if (!sourceId || !targetId || sourceId === targetId) return;

        // Move data
        if (markedBlocks[sourceId]) {
            // Check if target already has an event (conflict resolution: overwrite)
            if (markedBlocks[targetId]) {
                if (!confirm(`Overwrite existing event "${markedBlocks[targetId].text}"?`)) {
                    return;
                }
            }

            markedBlocks[targetId] = markedBlocks[sourceId];
            delete markedBlocks[sourceId];
            saveState();
            renderGrid();
        }
    });

    // Delegated Click Handler
    gridContainer.addEventListener('click', (e) => {
        const block = e.target.closest('.block');
        if (!block) return;

        // If clicking a label, we still want to trigger the block toggle
        // But if we just finished a drag, we shouldn't trigger click.
        // Browser usually handles this, but let's be safe.

        // Parse ID
        const parts = block.dataset.blockId.split('-');
        if (parts.length === 2) {
            const year = parseInt(parts[0]);
            const week = parseInt(parts[1]);
            toggleBlock(year, week, block);
        }
    });

    function renderGrid() {
        gridContainer.innerHTML = '';

        // Calculate current time context
        const now = new Date();
        const currentCalendarYear = now.getFullYear();
        const currentAgeYear = currentCalendarYear - birthYear;

        // Calculate current week index (0-51)
        const startOfYear = new Date(currentCalendarYear, 0, 1);
        const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
        const currentWeekIndex = Math.floor(days / 7);

        const currentMonthIndex = now.getMonth();

        if (currentView === 'weeks') {
            renderWeeksView(currentAgeYear, currentWeekIndex);
        } else if (currentView === 'months') {
            renderMonthsView(currentAgeYear, currentMonthIndex);
        } else {
            renderYearsView(currentAgeYear);
        }
    }

    function renderWeeksView(currentAgeYear, currentWeekIndex) {
        // State for "fill forward" logic
        let currentEra = null; // { text: "...", color: "..." }
        let eventCounter = 0; // To alternate label position

        for (let year = 0; year < TOTAL_YEARS; year++) {
            // Year Label
            const label = document.createElement('div');
            label.className = 'year-label';
            if (year % 5 === 0 || year === 0) {
                label.textContent = year;
            }
            gridContainer.appendChild(label);

            // Weeks Row
            const row = document.createElement('div');
            row.className = 'weeks-row';

            for (let week = 0; week < WEEKS_PER_YEAR; week++) {
                const block = document.createElement('div');
                block.className = 'block';
                const blockId = `${year}-${week}`;
                block.dataset.blockId = blockId;

                // Check for passed time
                if (year < currentAgeYear || (year === currentAgeYear && week < currentWeekIndex)) {
                    block.classList.add('past');
                }

                // Check if a new event starts here
                if (markedBlocks[blockId]) {
                    currentEra = markedBlocks[blockId];
                    block.classList.add('event-start');

                    // Make draggable
                    block.setAttribute('draggable', 'true');

                    // Create persistent label
                    const eventLabel = document.createElement('div');
                    eventLabel.className = 'event-label';
                    eventLabel.textContent = currentEra.text;

                    // Make label draggable too
                    eventLabel.setAttribute('draggable', 'true');

                    // Alternate position
                    if (eventCounter % 2 === 0) {
                        eventLabel.classList.add('top');
                    } else {
                        eventLabel.classList.add('bottom');
                    }
                    block.appendChild(eventLabel);

                    eventCounter++;
                }

                // Apply current era styling
                if (currentEra) {
                    block.style.backgroundColor = currentEra.color;
                    block.setAttribute('data-has-tooltip', 'true');
                } else {
                    // Only apply empty color if not past, or let CSS handle it
                }

                // Tooltip logic: show detailed info
                block.addEventListener('mouseenter', (e) => {
                    const age = year;
                    const calendarYear = birthYear + year;
                    const month = getMonthName(week);

                    // Priority: Specific event on this block > Current Era > None
                    const eventName = markedBlocks[blockId] ? markedBlocks[blockId].text : (currentEra ? currentEra.text : null);

                    let tooltipContent = `<strong>Age: ${age}</strong> | Year: ${calendarYear}<br>Month: ${month}`;

                    if (eventName) {
                        tooltipContent = `<strong>${eventName}</strong><br>` + tooltipContent;
                    }

                    showTooltip(e, tooltipContent);
                });

                block.addEventListener('mouseleave', hideTooltip);

                row.appendChild(block);
            }
            gridContainer.appendChild(row);
        }
    }

    // Revised renderMonthsView with correct state tracking
    function renderMonthsView(currentAgeYear, currentMonthIndex) {
        const YEARS_PER_ROW = 5;
        const totalRows = Math.ceil(TOTAL_YEARS / YEARS_PER_ROW);

        let currentEra = null; // Persists across rows/years
        let eventCounter = 0; // To alternate label position

        for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
            const startYear = rowIdx * YEARS_PER_ROW;
            const endYear = Math.min(startYear + YEARS_PER_ROW - 1, TOTAL_YEARS - 1);

            // Label
            const label = document.createElement('div');
            label.className = 'year-label';
            label.textContent = `${startYear}-${endYear}`;
            gridContainer.appendChild(label);

            // Row Container
            const row = document.createElement('div');
            row.className = 'weeks-row';

            for (let y = 0; y < YEARS_PER_ROW; y++) {
                const currentYear = startYear + y;
                if (currentYear >= TOTAL_YEARS) break;

                for (let m = 0; m < 12; m++) {
                    const block = document.createElement('div');
                    block.className = 'block';

                    // Determine weeks in this month
                    const startW = Math.floor(m * (WEEKS_PER_YEAR / 12));
                    const endW = Math.floor((m + 1) * (WEEKS_PER_YEAR / 12));

                    // Set target ID for dropping (first week of the month)
                    block.dataset.blockId = `${currentYear}-${startW}`;

                    // Check for passed time
                    if (currentYear < currentAgeYear || (currentYear === currentAgeYear && m < currentMonthIndex)) {
                        block.classList.add('past');
                    }

                    // Check for events in this month
                    let eventInMonth = null;
                    for (let w = startW; w < endW && w < WEEKS_PER_YEAR; w++) {
                        const id = `${currentYear}-${w}`;
                        if (markedBlocks[id]) {
                            eventInMonth = markedBlocks[id];
                            currentEra = eventInMonth; // Update era
                            break; // Take the first event found
                        }
                    }

                    if (eventInMonth) {
                        block.classList.add('event-start');

                        // Make draggable
                        block.setAttribute('draggable', 'true');
                        // Use the specific event ID as source
                        block.dataset.sourceId = Object.keys(markedBlocks).find(key => markedBlocks[key] === eventInMonth);


                        // Create persistent label
                        const eventLabel = document.createElement('div');
                        eventLabel.className = 'event-label';
                        eventLabel.textContent = eventInMonth.text;

                        // Make label draggable
                        eventLabel.setAttribute('draggable', 'true');

                        // Alternate position
                        if (eventCounter % 2 === 0) {
                            eventLabel.classList.add('top');
                        } else {
                            eventLabel.classList.add('bottom');
                        }
                        block.appendChild(eventLabel);

                        eventCounter++;
                    }

                    if (currentEra) {
                        block.style.backgroundColor = currentEra.color;
                        block.setAttribute('data-has-tooltip', 'true');
                    }

                    // Tooltip
                    block.addEventListener('mouseenter', (e) => {
                        const age = currentYear;
                        const calendarYear = birthYear + currentYear;
                        const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];

                        const eventName = eventInMonth ? eventInMonth.text : (currentEra ? currentEra.text : null);

                        let tooltipContent = `<strong>Age: ${age}</strong> | Year: ${calendarYear}<br>Month: ${monthName}`;
                        if (eventName) {
                            tooltipContent = `<strong>${eventName}</strong><br>` + tooltipContent;
                        }

                        showTooltip(e, tooltipContent);
                    });

                    block.addEventListener('mouseleave', hideTooltip);

                    row.appendChild(block);
                }
            }
            gridContainer.appendChild(row);
        }
    }

    function renderYearsView(currentAgeYear) {
        const YEARS_PER_ROW = 10;
        const totalRows = Math.ceil(TOTAL_YEARS / YEARS_PER_ROW);

        let currentEra = null; // Persists across rows/years
        let eventCounter = 0; // To alternate label position

        for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
            const startYear = rowIdx * YEARS_PER_ROW;
            const endYear = Math.min(startYear + YEARS_PER_ROW - 1, TOTAL_YEARS - 1);

            // Label
            const label = document.createElement('div');
            label.className = 'year-label';
            label.textContent = `${startYear}-${endYear}`;
            gridContainer.appendChild(label);

            // Row Container
            const row = document.createElement('div');
            row.className = 'weeks-row';

            for (let y = 0; y < YEARS_PER_ROW; y++) {
                const currentYear = startYear + y;
                if (currentYear >= TOTAL_YEARS) break;

                const block = document.createElement('div');
                block.className = 'block';
                // Target ID for dropping (first week of the year)
                block.dataset.blockId = `${currentYear}-0`;

                // Check for passed time
                if (currentYear < currentAgeYear) {
                    block.classList.add('past');
                }

                // Find all events in this year
                let eventsInYear = [];
                for (let w = 0; w < WEEKS_PER_YEAR; w++) {
                    const id = `${currentYear}-${w}`;
                    if (markedBlocks[id]) {
                        eventsInYear.push(markedBlocks[id]);
                        currentEra = markedBlocks[id]; // Update era
                    }
                }

                if (eventsInYear.length > 0) {
                    const primaryEvent = eventsInYear[0];
                    block.classList.add('event-start');

                    // Disable dragging for now as per plan
                    block.setAttribute('draggable', 'false');

                    // Create persistent label
                    const eventLabel = document.createElement('div');
                    eventLabel.className = 'event-label';

                    let labelText = primaryEvent.text;
                    if (eventsInYear.length > 1) {
                        labelText += ' +';
                    }
                    eventLabel.textContent = labelText;

                    // Alternate position
                    if (eventCounter % 2 === 0) {
                        eventLabel.classList.add('top');
                    } else {
                        eventLabel.classList.add('bottom');
                    }
                    block.appendChild(eventLabel);

                    eventCounter++;

                    // Use color of the first event
                    block.style.backgroundColor = primaryEvent.color;
                    block.setAttribute('data-has-tooltip', 'true');
                } else if (currentEra) {
                    block.style.backgroundColor = currentEra.color;
                    block.setAttribute('data-has-tooltip', 'true');
                }

                // Tooltip
                block.addEventListener('mouseenter', (e) => {
                    const age = currentYear;
                    const calendarYear = birthYear + currentYear;

                    let tooltipContent = `<strong>Age: ${age}</strong> | Year: ${calendarYear}`;

                    if (eventsInYear.length > 0) {
                        tooltipContent = `<strong>Events:</strong><br>`;
                        eventsInYear.forEach(evt => {
                            tooltipContent += `• ${evt.text}<br>`;
                        });
                        tooltipContent += `<br>Age: ${age} | Year: ${calendarYear}`;
                    } else if (currentEra) {
                        tooltipContent = `<strong>${currentEra.text}</strong><br>` + tooltipContent;
                    }

                    showTooltip(e, tooltipContent);
                });

                block.addEventListener('mouseleave', hideTooltip);

                row.appendChild(block);
            }
            gridContainer.appendChild(row);
        }
    }

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all marked events?')) {
            markedBlocks = {};
            saveState();
            renderGrid();
        }
    });

    const exportCsvBtn = document.getElementById('export-csv-btn');
    const importCsvBtn = document.getElementById('import-csv-btn');
    const csvInput = document.getElementById('csv-input');
    const exportPngBtn = document.getElementById('export-png-btn');

    // --- Export/Import Logic ---

    exportCsvBtn.addEventListener('click', () => {
        let csvBody = "";

        // Header with metadata
        csvBody += `# BirthYear: ${birthYear}\n`;
        csvBody += "Year,Week,Description,Color\n";

        // Rows
        for (const [key, data] of Object.entries(markedBlocks)) {
            const [y, w] = key.split('-');
            // Escape quotes in description
            const description = data.text.replace(/"/g, '""');
            csvBody += `${y},${w},"${description}",${data.color}\n`;
        }

        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvBody);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "life_events.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    importCsvBtn.addEventListener('click', () => {
        csvInput.click();
    });

    csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');

            const newMarkedBlocks = {};
            let newBirthYear = birthYear;

            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                // Parse metadata
                if (line.startsWith('# BirthYear:')) {
                    const parts = line.split(':');
                    if (parts[1]) {
                        newBirthYear = parseInt(parts[1].trim());
                    }
                    return;
                }

                // Skip header
                if (line.startsWith('Year,Week')) return;

                // Parse CSV row: Year, Week, "Description", Color
                // Simple regex to handle quoted strings
                const match = line.match(/^(\d+),(\d+),"(.*)",(#\w+)$/);
                if (match) {
                    const [_, y, w, desc, color] = match;
                    newMarkedBlocks[`${y}-${w}`] = {
                        text: desc.replace(/""/g, '"'), // Unescape quotes
                        color: color
                    };
                } else {
                    // Fallback for simple split if regex fails (e.g. no quotes)
                    // But our export always quotes. Let's try a simpler split if needed.
                    // For now, assume our export format.
                }
            });

            if (confirm(`Importing will overwrite current data. Found ${Object.keys(newMarkedBlocks).length} events. Proceed?`)) {
                markedBlocks = newMarkedBlocks;
                birthYear = newBirthYear;
                birthYearInput.value = birthYear;
                saveState();
                localStorage.setItem(BIRTH_YEAR_KEY, birthYear);
                renderGrid();
                alert('Import successful!');
            }

            // Reset input so same file can be selected again
            csvInput.value = '';
        };
        reader.readAsText(file);
    });

    exportPngBtn.addEventListener('click', () => {
        // Use html2canvas
        if (typeof html2canvas === 'undefined') {
            alert('Error: html2canvas library not loaded.');
            return;
        }

        // Temporarily show full grid if in a scrollable container? 
        // Our grid is full height, so it should be fine.

        html2canvas(gridContainer, {
            backgroundColor: "#ffffff",
            scale: 2 // Higher resolution
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'life-in-weeks.png';
            link.href = canvas.toDataURL();
            link.click();
        }).catch(err => {
            console.error('Export failed:', err);
            alert('Failed to export image.');
        });
    });

    renderGrid();
});
