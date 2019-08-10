import * as d3 from 'd3'
import * as dagreD3 from 'dagre-d3'


export default class DragListener {

  constructor(graph, renderer) {
    this.graph = graph
    this.renderer = renderer
    this.selectedNode = null
    this.draggingNode = null
    this.draggingNodeID = null
    this.cachedLinks = []
  }

  call = () => {
    return d3.drag()
      .on('start', this.dragstart)
      .on('drag', this.dragmove)
      .on('end', this.dragend)
  }

  setSelectedNode = selectedNode => {
    if (!this.renderer.isBehaviourActive('nodeDrag')) {
      return
    }
    // console.log('update selecetd node', selectedNode)
    this.selectedNode = selectedNode
    this.updateLink()
  }

  getTranslation(transform) {
    if (!transform) return [0, 0, 1]
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttributeNS(null, "transform", transform);
    var matrix = g.transform.baseVal.consolidate().matrix;
    return [matrix.e, matrix.f, matrix.a];
  }

  updateLink = () => {
    let data = [];

    if (this.draggingNode !== null && this.selectedNode !== null) {
      const [dx, dy, k] = this.getTranslation(d3.select('svg#treeSVG g').attr('transform'))

      const src = this.selectedNode

      const tgt = this.draggingNode

      data = [{
        source: {
          y: src.y*k + dy,
          x: src.x*k + dx
        },
        target: {
          y: tgt.y*k + dy,
          x: tgt.x*k + dx
        }
      }]
    }

    const link = d3.select('svg#treeSVG').selectAll(".templink").data(data)

    link.enter().append('line')
      .attr('class', 'templink')
      .attr("x1", data.length>0 ? data[0].source.x : 0)
      .attr("y1", data.length>0 ? data[0].source.y : 0)
      .attr("x2", data.length>0 ? data[0].target.x : 0)
      .attr("y2", data.length>0 ? data[0].target.y : 0)
      .attr('pointer-events', 'none');

    link
      .attr("x1", data.length>0 ? data[0].source.x : 0)
      .attr("y1", data.length>0 ? data[0].source.y : 0)
      .attr("x2", data.length>0 ? data[0].target.x : 0)
      .attr("y2", data.length>0 ? data[0].target.y : 0)

    link.exit().remove()
  }

  dragstart = d => {
    if (!this.renderer.isBehaviourActive('nodeDrag')) {
      return
    }
    d3.event.sourceEvent.stopPropagation()
    this.renderer.setBehaviour('edgeDraw', false)

    this.draggingNodeID = null
    this.draggingNode = this.graph.node(d)


    this.updateLink()
  }

  dragmove = d => {
    if (!this.renderer.isBehaviourActive('nodeDrag')) {
      return
    }
    const node = d3.select(`#node${d}`)

    if (this.draggingNodeID === null) {
      const connectedEdges = this.graph.nodeEdges(d)
      this.cachedLinks = connectedEdges

      this.draggingNodeIsParent = false
      connectedEdges.forEach(e => {
        if (e.v == d) { // d is parent
          this.draggingNodeIsParent = true
        }

        d3.select(`#edgepath${e.v}-${e.w}`).attr('class', 'path edgeHidden')
        // this.graph.removeEdge(e.v, e.w)
      })
      // remove edges of connected and save them

      const node = d3.select('#node' + d)
      node.attr('pointer-events', 'none')
      node.select('.ghostCircle').attr('pointer-events', 'none');
      d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
      node.attr('class', 'node rendered activeDrag');

    }
    this.draggingNodeID = d
    this.draggingNode = this.graph.node(d)
    const prevX = this.draggingNode.x,
          prevY = this.draggingNode.y

    this.draggingNode.x += d3.event.dx
    this.draggingNode.y += d3.event.dy

    node.attr('transform', 'translate(' + this.draggingNode.x + ',' + this.draggingNode.y + ')')

    var dx = this.draggingNode.x - prevX,
        dy = this.draggingNode.y - prevY


    this.updateLink()
  }


  clearCachedLinks() {
    this.cachedLinks.forEach(e => {
      d3.select(`#edgepath${e.v}-${e.w}`).attr('class', 'path')
    })
  }

  /**
   * Fold child links into node
   * For the parents there are several cases:
   * 1. node has no parent (node is a root)
   *    
   * 2. node has parents
   *    - delete links to parents
   */
  dragend = d => {
    this.renderer.setBehaviour('edgeDraw', true)
    if (!this.renderer.isBehaviourActive('nodeDrag')) {
      return
    }
    const node = d3.select(`#node${d}`)
    d3.selectAll('.ghostCircle').attr('class', 'ghostCircle')
    node.attr('class', 'node rendered')
    node.attr('pointer-events', '')
    node.select('.ghostCircle').attr('pointer-events', '')

    if (this.selectedNode) {
      if (this.graph.hasEdge(this.selectedNode.customId, this.draggingNodeID)) {
        this.renderer.dispatchError('Link already exists.')
        this.clearCachedLinks()
      }
      this.cachedLinks.forEach(e => {
        if (!this.draggingNodeIsParent) {
          this.graph.removeEdge(e.v, e.w)
        } else {
          d3.select(`#edgepath${e.v}-${e.w}`).attr('class', 'path')
        }
      })
      if (this.selectedNode) {
        this.renderer.setEdge(this.selectedNode.customId, d)
      }
    } else {
      this.clearCachedLinks()
    }

    this.draggingNode = null
    this.selectedNode = null
    this.updateLink()

    this.renderer.render(this.graph)
  }

}
