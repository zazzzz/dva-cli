/**
 * @Author: mark
 * @Date:   2017-04-07T13:33:13+08:00
 * @Email:  mark_z1988@icloud.com
 * @Filename: pagerank.js
 * @Last modified by:   mark
 * @Last modified time: 2017-04-24T12:25:15+08:00
 * @License: MIT
 */

/*
* https://github.com/anvaka/ngraph.pagerank/blob/master/index.js
*
*/
/* eslint-disable */
var elementsPerNode = 5;

export default function pagerank(graph, internalJumpProbability, epsilon) {
  if (typeof epsilon !== 'number') epsilon = 0.001;
  if (typeof internalJumpProbability !== 'number') internalJumpProbability = 0.85;

  var nodesCount = graph.getNodesCount();

  var asmGraph = initializeAsmGraph(graph);
  var nodes = asmGraph.nodes;
  var edges = asmGraph.edges;
  computePageRank(nodes, edges, nodesCount, internalJumpProbability, epsilon);
  return finalResultsFromAsm(nodes, asmGraph.numberToId);
}

function computePageRank(nodes, edges, nodesCount, internalJumpProbability, epsilon) {
  var done = false; // when done is true, the algorithm is converged
  var distance = 0; // distance between two eigenvectors in adjacent timesteps
  var leakedRank = 0; // we account leaked rank to solve spider traps and dead ends

  var currentRank;
  var idx;

  do {
    leakedRank = 0;
    for (var j = 0; j < nodesCount; ++j) {
      idx = j * elementsPerNode;
      currentRank = 0;
      var neighborsLength = nodes[idx + 3];
      if (neighborsLength === 0) { // indegree === 0
        nodes[idx] = 0; // node.rank
      } else {
        var neighborsStart = nodes[idx + 4];
        for (var i = neighborsStart; i < neighborsStart + neighborsLength; ++i) {
          var nIdx = edges[i];
          currentRank += nodes[nIdx + 1] / nodes[nIdx + 2];
          //currentRank += neighbors[i].prevRank / neighbors[i].outdegree;
        }
        nodes[idx] = internalJumpProbability * currentRank;
        leakedRank += nodes[idx];
      }
    }
    // now reinsert the leaked PageRank and compute distance:
    leakedRank = (1 - leakedRank) / nodesCount;
    distance = 0;
    for (j = 0; j < nodesCount; ++j) {
      idx = j * elementsPerNode;
      currentRank = nodes[idx] + leakedRank;
      distance += Math.abs(currentRank - nodes[idx + 1]); // prevRank
      nodes[idx + 1] = currentRank; // set up for the next iteration prevRank
    }
    done = distance < epsilon;
  } while (!done);
}

function finalResultsFromAsm(nodes, idLookup) {
  var result = Object.create(null);
  var length = nodes.length / elementsPerNode;

  for (var i = 0; i < length; ++i) {
    var idx = i * elementsPerNode;
    result[idLookup[i]] = nodes[idx + 1]; //.prevRank;
  }

  return result;
}

function initializeAsmGraph(graph) {
  var i = 0;
  var lastEdge = 0;
  var nodesCount = graph.getNodesCount();
  var edgesCount = graph.getLinksCount();
  var initialRank = (1 / nodesCount);
  var nodes = new Float64Array(nodesCount * elementsPerNode);
  var edges = new Float64Array(edgesCount);
  var numberToId = new Array(nodesCount);

  var idToNumber = Object.create(null);

  graph.forEachNode(addNode);
  graph.forEachNode(initLinks);

  return {
    nodes: nodes,
    edges: edges,
    numberToId: numberToId
  };

  function addNode(node) {
    var idx = i * elementsPerNode;
    // initial rank
    nodes[idx] = initialRank;
    // prevRank
    nodes[idx + 1] = initialRank;
    // outDegree
    nodes[idx + 2] = 0;
    // inDegree
    nodes[idx + 3] = 0;
    // neighbors array, it's length is the same as inDegree
    nodes[idx + 4] = -1;

    idToNumber[node.id] = i;
    numberToId[i] = node.id;
    i += 1;
  }

  function initLinks(node) {
    var idx = idToNumber[node.id] * elementsPerNode;
    var inDegree = 0;
    var outDegree = 0;
    var edgeStart = lastEdge;

    graph.forEachLinkedNode(node.id, initLink);

    nodes[idx + 2] = outDegree;
    nodes[idx + 3] = inDegree;
    if (edgeStart !== lastEdge) {
      nodes[idx + 4] = edgeStart;
    }

    function initLink(otherNode, link) {
      if (link.fromId === node.id) {
        outDegree += 1;
      }
      if (link.toId === node.id) {
        inDegree += 1;
        // TODO: this needs to be configurable. E.g. use outdegree
        edges[lastEdge++] = idToNumber[otherNode.id] * elementsPerNode;
      }
    }
  }
}
