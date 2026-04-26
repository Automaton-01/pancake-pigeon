// Levels — all platforming, no bridge-drawing. Tuned for Anto (walkSpeed 4.5,
// jumpV -11). Gaps stay under ~150px horizontal and ~120px vertical so
// every platform is reachable with a normal run-jump.

export const LEVELS = [
    {
        id: 1,
        name: 'First Hop',
        worldWidth: 2700,
        worldHeight: 768,
        spawn: { x: 80, y: 580 },
        // Easy intro: a run-and-hop across stepping stones, one small spike
        // pit, then a low staircase up to a bonus pancake before the goal.
        platforms: [
            { x: 220,  y: 720, w: 440, h: 80 },   // start ground
            { x: 580,  y: 720, w: 100, h: 40 },   // stone 1 (gap 60)
            { x: 760,  y: 720, w: 100, h: 40 },   // stone 2 (gap 80)
            { x: 970,  y: 720, w: 180, h: 40 },   // mid landing
            { x: 1240, y: 700, w: 140, h: 40 },   // tiny step up
            { x: 1450, y: 660, w: 140, h: 40 },   // step up
            { x: 1660, y: 620, w: 140, h: 40 },   // top step (bonus pancake)
            { x: 1900, y: 700, w: 140, h: 40 },   // descend
            { x: 2120, y: 720, w: 140, h: 40 },   // last hop
            { x: 2440, y: 720, w: 300, h: 80 }    // goal platform
        ],
        spikes: [
            { x: 1060, y: 700, w: 80 }            // small spike pit on the mid landing
        ],
        pancakes: [
            { x: 220,  y: 620 },
            { x: 580,  y: 620 },
            { x: 970,  y: 620 },
            { x: 1660, y: 520 },                  // up on the top step (reward)
            { x: 2440, y: 620 }
        ],
        hazards: [
            { x: 970,  y: 660, type: 'avocado' },
            { x: 2120, y: 660, type: 'beet' }
        ],
        goal: { x: 2580, y: 614 },
        baby: { x: 1450, y: 600 },
        hint: 'Hop the gaps and dodge the rotten food'
    },

    {
        id: 2,
        name: 'Sky Climb',
        worldWidth: 1500,
        worldHeight: 1320,
        spawn: { x: 90, y: 1180 },
        // Vertical climb: zig-zag staircase up the canyon. Each step is at
        // most ~100px up and ~120px across — within Anto's run-jump range.
        // A side branch off the right offers bonus pancakes for confident
        // jumpers, then loops back to the main path.
        platforms: [
            { x: 180,  y: 1280, w: 360, h: 40 },  // start ground
            { x: 520,  y: 1180, w: 120, h: 30 },  // step 1 right
            { x: 720,  y: 1080, w: 120, h: 30 },  // step 2 right
            { x: 920,  y: 1180, w: 120, h: 30 },  // bonus side branch (drop right)
            { x: 1200, y: 1080, w: 140, h: 30 },  // far right branch top
            { x: 540,  y: 980,  w: 120, h: 30 },  // step 3 left of step 2
            { x: 320,  y: 880,  w: 120, h: 30 },  // step 4 further left
            { x: 540,  y: 780,  w: 120, h: 30 },  // step 5 right again
            { x: 760,  y: 700,  w: 120, h: 30 },  // step 6
            { x: 980,  y: 600,  w: 120, h: 30 },  // step 7
            { x: 1200, y: 500,  w: 120, h: 30 },  // step 8
            { x: 1000, y: 400,  w: 120, h: 30 },  // step 9 swap back left
            { x: 760,  y: 300,  w: 120, h: 30 },  // step 10
            { x: 540,  y: 220,  w: 320, h: 40 }   // goal platform (top)
        ],
        spikes: [],   // climb is hazard-only — spikes sit awkwardly on the small steps
        pancakes: [
            { x: 180,  y: 1180 },
            { x: 920,  y: 1080 },                 // side branch reward
            { x: 1200, y: 980  },                 // top of side branch
            { x: 540,  y: 680  },                 // mid-climb pickup
            { x: 700,  y: 160  }                  // near the goal
        ],
        hazards: [
            { x: 320,  y: 820,  type: 'beet' },
            { x: 1000, y: 340,  type: 'egg' }
        ],
        goal: { x: 660, y: 174 },
        baby: { x: 540, y: 720 },
        hint: 'Climb the canyon — every step counts'
    },

    {
        id: 3,
        name: 'Spike Gauntlet',
        worldWidth: 3000,
        worldHeight: 900,
        spawn: { x: 80, y: 660 },
        // The mean one. Tight platforms separated by spike pits, with
        // hazards parked right where you want to land. Two layers — a high
        // safe path and a low risky path with extra pancakes.
        platforms: [
            // ---- Lower safe-ish row (ground level) ----
            { x: 180,  y: 800, w: 280, h: 60 },
            { x: 480,  y: 800, w: 120, h: 60 },
            { x: 660,  y: 800, w: 100, h: 60 },
            { x: 840,  y: 800, w: 100, h: 60 },
            { x: 1020, y: 800, w: 100, h: 60 },
            { x: 1220, y: 800, w: 140, h: 60 },
            { x: 1440, y: 800, w: 100, h: 60 },
            { x: 1620, y: 800, w: 140, h: 60 },
            { x: 1840, y: 800, w: 100, h: 60 },
            { x: 2020, y: 800, w: 100, h: 60 },
            { x: 2200, y: 800, w: 140, h: 60 },
            { x: 2400, y: 800, w: 120, h: 60 },
            { x: 2580, y: 800, w: 120, h: 60 },
            { x: 2820, y: 800, w: 200, h: 60 },   // goal platform

            // ---- Upper bonus row (riskier high path) ----
            { x: 720,  y: 580, w: 120, h: 30 },
            { x: 940,  y: 540, w: 120, h: 30 },
            { x: 1180, y: 500, w: 120, h: 30 },
            { x: 1420, y: 540, w: 120, h: 30 },
            { x: 1660, y: 580, w: 120, h: 30 }
        ],
        spikes: [
            // Spike pits between every gap on the lower row
            { x: 570,  y: 780, w: 60 },
            { x: 750,  y: 780, w: 40 },
            { x: 930,  y: 780, w: 40 },
            { x: 1115, y: 780, w: 50 },
            { x: 1330, y: 780, w: 60 },
            { x: 1530, y: 780, w: 60 },
            { x: 1730, y: 780, w: 60 },
            { x: 1930, y: 780, w: 50 },
            { x: 2110, y: 780, w: 50 },
            { x: 2310, y: 780, w: 60 },
            { x: 2490, y: 780, w: 50 },
            { x: 2700, y: 780, w: 80 }
        ],
        pancakes: [
            { x: 180,  y: 700 },
            { x: 940,  y: 460 },                  // up high (risky path)
            { x: 1420, y: 460 },                  // up high
            { x: 2200, y: 700 },
            { x: 2820, y: 700 }                   // near goal
        ],
        hazards: [
            { x: 660,  y: 740, type: 'avocado' },
            { x: 1220, y: 740, type: 'beet' },
            { x: 1620, y: 740, type: 'egg' },
            { x: 2020, y: 740, type: 'avocado' },
            { x: 2400, y: 740, type: 'beet' },
            { x: 1180, y: 460, type: 'egg' }      // sitting on top of the high path
        ],
        goal: { x: 2900, y: 694 },
        baby: { x: 1620, y: 750 },
        hint: 'Tiny platforms over spikes — time your jumps'
    }
];
