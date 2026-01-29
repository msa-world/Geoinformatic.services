// Simplified polygons for major landmasses (Long, Lat)
// Used to filter particles for the Earth variant of ParticleGlobe

export const worldPolygons = [
    // North America (Simplified)
    [
        [-168, 70], [-120, 70], [-55, 75], [-60, 50], [-50, 45],
        [-80, 25], [-75, 10], [-80, 8], [-100, 15], [-115, 30],
        [-130, 50], [-168, 70]
    ],
    // South America
    [
        [-80, 10], [-35, -5], [-35, -35], [-55, -55], [-75, -55],
        [-80, -20], [-80, 10]
    ],
    // Eurasia (Very Simplified)
    [
        [-10, 35], [10, 35], [30, 30], [50, 10], [120, 20],
        [150, 50], [170, 70], [180, 75], [10, 75], [-10, 35]
    ],
    // Europe/West Asia fix
    [
        [-10, 36], [30, 30], [40, 40], [20, 70], [-10, 60], [-10, 36]
    ],
    // Africa
    [
        [-18, 35], [30, 30], [50, 12], [42, -15], [30, -35],
        [15, -35], [10, 5], [-18, 15], [-18, 35]
    ],
    // Australia
    [
        [113, -22], [153, -22], [153, -39], [113, -39], [113, -22]
    ],
    // Islands (Japan, UK, etc - roughly)
    [[130, 30], [145, 30], [145, 45], [130, 45], [130, 30]], // Japanish
    [[-10, 50], [2, 50], [2, 60], [-10, 60], [-10, 50]], // UKish
];

export const isPointInAnyPolygon = (point: number[], polygons: number[][][]) => {
    // Ray-casting for multiple polygons
    // point: [lon, lat]
    const x = point[0], y = point[1];
    let inside = false;

    for (const polygon of polygons) {
        let polyInside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) polyInside = !polyInside;
        }
        if (polyInside) return true;
    }
    return false;
};
