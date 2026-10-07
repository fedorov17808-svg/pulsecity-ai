import { describe, it, expect } from 'vitest';
import { findOptimalEmergencyRoute, ACCRA_ROAD_GRAPH } from '../utils/roadGraphRouting';

describe('Accra Road Network Dijkstra / A* Emergency Routing', () => {
  it('finds the shortest path between Kwame Nkrumah Circle and 37 Military Hospital', () => {
    const route = findOptimalEmergencyRoute("N-CIRCLE", "N-37MIL");

    expect(route.success).toBe(true);
    expect(route.pathNodeIds).toBeDefined();
    expect(route.pathNodeIds[0]).toBe("N-CIRCLE");
    expect(route.pathNodeIds[route.pathNodeIds.length - 1]).toBe("N-37MIL");
    expect(route.estimatedTimeNormalMin).toBeGreaterThan(0);
    expect(route.estimatedTimeNormalMin).toBeLessThan(30);
  });

  it('reroutes around blocked road corridors', () => {
    // Normal route from N-CIRCLE to N-RIDGE is direct.
    // If N-CIRCLE_N-RIDGE is blocked, it should reroute via N-MINISTRIES
    const roadConditions = {
      "N-CIRCLE_N-RIDGE": { isBlocked: true },
      "N-RIDGE_N-CIRCLE": { isBlocked: true }
    };

    const route = findOptimalEmergencyRoute("N-CIRCLE", "N-RIDGE", roadConditions);

    expect(route.success).toBe(true);
    expect(route.pathNodeIds).toEqual(["N-CIRCLE", "N-MINISTRIES", "N-RIDGE"]);
  });

  it('rejects invalid or non-existent node IDs safely', () => {
    const badStart = findOptimalEmergencyRoute("NON_EXISTENT", "N-37MIL");
    expect(badStart.success).toBe(false);
    expect(badStart.error).toBeDefined();

    const badTarget = findOptimalEmergencyRoute("N-CIRCLE", "INVALID_TARGET");
    expect(badTarget.success).toBe(false);
    expect(badTarget.error).toBeDefined();
  });
});
