/**
 * =============================================================================
 * EVACUATION MODULE — INDEX
 * Re-export semua yang dibutuhkan dari satu titik impor:
 *   import { shelters, findOptimalEvacuationRoutes, ... } from '@/lib/evacuation'
 * =============================================================================
 */

export type { Point, Shelter, RoadNode, RoadEdge, RouteResult, DijkstraResult } from './types.ts'
export { shelters }              from './shelters.ts'
export { hazardZones }           from './hazardZones.ts'
export { roadNodes, roadEdges }  from './roadNetwork.ts'
export { calculateHaversine, findNearestNode } from './haversine.ts'
export { dijkstra }              from './dijkstra.ts'
export { findOptimalEvacuationRoutes, getNearestSheltersByHaversine } from './routing.ts'

