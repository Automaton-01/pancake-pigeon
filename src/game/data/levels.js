export const LEVELS = [
    {
        id: 1,
        name: 'First Crumb',
        worldWidth: 1500,
        worldHeight: 768,
        spawn: { x: 80, y: 580 },
        platforms: [
            { x: 300, y: 720, w: 600, h: 80 },
            { x: 1150, y: 720, w: 700, h: 80 }
        ],
        spikes: [],
        pancakes: [
            { x: 250, y: 620 },
            { x: 1000, y: 620 },
            { x: 1300, y: 620 }
        ],
        goal: { x: 1420, y: 620 },
        inkBudget: 280,
        hint: 'Drag to draw a bridge across the gap'
    },
    {
        id: 2,
        name: 'Stair Climb',
        worldWidth: 1400,
        worldHeight: 1300,
        spawn: { x: 90, y: 1180 },
        platforms: [
            { x: 200, y: 1280, w: 400, h: 40 },
            { x: 700, y: 1050, w: 220, h: 30 },
            { x: 1050, y: 850, w: 220, h: 30 },
            { x: 1280, y: 600, w: 200, h: 30 },
            { x: 1100, y: 380, w: 350, h: 30 }
        ],
        spikes: [],
        pancakes: [
            { x: 750, y: 970 },
            { x: 1100, y: 770 },
            { x: 1320, y: 510 }
        ],
        goal: { x: 1180, y: 290 },
        inkBudget: 800,
        hint: 'Build steps upward — careful with your ink!'
    },
    {
        id: 3,
        name: 'Spike Trap',
        worldWidth: 1700,
        worldHeight: 768,
        spawn: { x: 80, y: 580 },
        platforms: [
            { x: 175, y: 720, w: 350, h: 80 },
            { x: 700, y: 720, w: 250, h: 80 },
            { x: 1200, y: 720, w: 250, h: 80 },
            { x: 1600, y: 720, w: 200, h: 80 }
        ],
        spikes: [
            { x: 525, y: 695, w: 175 },
            { x: 1075, y: 695, w: 125 },
            { x: 1425, y: 695, w: 175 }
        ],
        pancakes: [
            { x: 200, y: 620 },
            { x: 750, y: 620 },
            { x: 1250, y: 620 }
        ],
        goal: { x: 1620, y: 600 },
        inkBudget: 500,
        hint: 'Bridge the spike pits — touch a spike and you respawn!'
    }
];
