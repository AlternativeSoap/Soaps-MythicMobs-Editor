/**
 * Graph Utilities
 * Algorithms for dependency graph analysis
 * - Cycle detection using DFS
 * - Topological sorting
 * - Path finding
 */

class GraphUtils {
    /**
     * Detect all cycles in a directed graph using DFS
     * @param {Map<string, string[]>} graph - Adjacency list (node -> [dependencies])
     * @returns {Array<string[]>} - Array of cycles, each cycle is array of node names
     */
    static detectCycles(graph) {
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const path = [];

        for (const node of graph.keys()) {
            if (!visited.has(node)) {
                this._dfsDetectCycle(node, graph, visited, recursionStack, path, cycles);
            }
        }

        return cycles;
    }

    /**
     * DFS helper for cycle detection
     * @private
     */
    static _dfsDetectCycle(node, graph, visited, recursionStack, path, cycles) {
        visited.add(node);
        recursionStack.add(node);
        path.push(node);

        const neighbors = graph.get(node) || [];
        
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                this._dfsDetectCycle(neighbor, graph, visited, recursionStack, path, cycles);
            } else if (recursionStack.has(neighbor)) {
                // Found a cycle - extract it from the path
                const cycleStartIndex = path.indexOf(neighbor);
                const cycle = [...path.slice(cycleStartIndex), neighbor];
                
                // Only add if we haven't found this cycle already (in different rotation)
                if (!this._isDuplicateCycle(cycle, cycles)) {
                    cycles.push(cycle);
                }
            }
        }

        path.pop();
        recursionStack.delete(node);
    }

    /**
     * Check if cycle is a duplicate (same cycle, different rotation)
     * @private
     */
    static _isDuplicateCycle(newCycle, existingCycles) {
        if (newCycle.length === 0) return false;
        
        for (const existing of existingCycles) {
            if (existing.length !== newCycle.length) continue;
            
            // Check all rotations
            for (let offset = 0; offset < existing.length; offset++) {
                let matches = true;
                for (let i = 0; i < existing.length - 1; i++) { // -1 because last node is duplicate of first
                    if (existing[(i + offset) % (existing.length - 1)] !== newCycle[i]) {
                        matches = false;
                        break;
                    }
                }
                if (matches) return true;
            }
        }
        
        return false;
    }

    /**
     * Find all nodes with no incoming edges (orphans)
     * @param {Map<string, string[]>} graph - Adjacency list
     * @param {string[]} allNodes - All node names that should exist
     * @returns {string[]} - Array of orphaned node names
     */
    static findOrphans(graph, allNodes) {
        const nodesWithIncomingEdges = new Set();
        
        // Find all nodes that are referenced by others
        for (const [node, dependencies] of graph.entries()) {
            dependencies.forEach(dep => nodesWithIncomingEdges.add(dep));
        }
        
        // Return nodes that exist but have no incoming edges
        return allNodes.filter(node => !nodesWithIncomingEdges.has(node));
    }

    /**
     * Find all nodes that depend on a given node (impact analysis)
     * @param {string} targetNode - Node to check impact for
     * @param {Map<string, string[]>} graph - Adjacency list
     * @returns {string[]} - Array of nodes that depend on targetNode
     */
    static findDependents(targetNode, graph) {
        const dependents = [];
        
        for (const [node, dependencies] of graph.entries()) {
            if (dependencies.includes(targetNode)) {
                dependents.push(node);
            }
        }
        
        return dependents;
    }

    /**
     * Topological sort (useful for determining safe deletion order)
     * @param {Map<string, string[]>} graph - Adjacency list
     * @returns {string[]|null} - Sorted nodes or null if cycle exists
     */
    static topologicalSort(graph) {
        const inDegree = new Map();
        const result = [];
        
        // Initialize in-degree for all nodes
        for (const node of graph.keys()) {
            inDegree.set(node, 0);
        }
        
        // Calculate in-degrees
        for (const [node, dependencies] of graph.entries()) {
            dependencies.forEach(dep => {
                inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
            });
        }
        
        // Queue nodes with in-degree 0
        const queue = [];
        for (const [node, degree] of inDegree.entries()) {
            if (degree === 0) queue.push(node);
        }
        
        // Process queue
        while (queue.length > 0) {
            const node = queue.shift();
            result.push(node);
            
            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                inDegree.set(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }
        
        // If result doesn't contain all nodes, there's a cycle
        return result.length === graph.size ? result : null;
    }

    /**
     * Find shortest path between two nodes using BFS
     * @param {string} start - Start node
     * @param {string} end - End node
     * @param {Map<string, string[]>} graph - Adjacency list
     * @returns {string[]|null} - Path or null if no path exists
     */
    static findPath(start, end, graph) {
        if (!graph.has(start)) return null;
        
        const queue = [[start]];
        const visited = new Set([start]);
        
        while (queue.length > 0) {
            const path = queue.shift();
            const node = path[path.length - 1];
            
            if (node === end) return path;
            
            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        
        return null;
    }

    /**
     * Calculate graph statistics
     * @param {Map<string, string[]>} graph - Adjacency list
     * @returns {Object} - Statistics object
     */
    static getStats(graph) {
        let totalEdges = 0;
        let maxDependencies = 0;
        let maxDependents = 0;
        
        const inDegree = new Map();
        
        for (const [node, dependencies] of graph.entries()) {
            totalEdges += dependencies.length;
            maxDependencies = Math.max(maxDependencies, dependencies.length);
            
            // Calculate in-degrees
            dependencies.forEach(dep => {
                inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
            });
        }
        
        // Find max in-degree
        for (const degree of inDegree.values()) {
            maxDependents = Math.max(maxDependents, degree);
        }
        
        return {
            nodes: graph.size,
            edges: totalEdges,
            maxDependencies,
            maxDependents,
            avgDependencies: graph.size > 0 ? (totalEdges / graph.size).toFixed(2) : 0
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.GraphUtils = GraphUtils;
}
