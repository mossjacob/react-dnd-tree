import * as d3 from 'd3'
import * as dagreD3 from 'dagre-d3'


export default class EdgeDraw {

  constructor(graph, renderer) {
    this.graph = graph
    this.renderer = renderer
    this.selectedNodeID = null
    this.draggingNodeID = null
    this.anchor = null
  }

  call = (direction) => {
    this.notchID = direction == 'UP' ? 'notchUp' : 'notchDown'
    this.svg = d3.select('svg#treeSVG')
    return d3.drag()
      .on('start', this.dragstart)
      .on('drag', this.dragmove)
      .on('end', this.dragend)
  }

  setSelectedNode = id => {
    console.log('update selected node', id)
    this.selectedNodeID = id
    // this.updateLink()
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

    if (this.anchor !== null) {

      const [dx, dy, k] = this.getTranslation(d3.select('svg#treeSVG g').attr('transform'))
      const coords= d3.mouse(this.svg.node());
      const src = {x: coords[0], y: coords[1]}
      console.log(src)
      const tgt = this.anchor
      console.log(tgt.x, tgt.y)
      data = [{
        source: {
          x: src.y,
          y: src.x
        },
        target: {
          x: tgt.y,
          y: tgt.x
        }
      }]

      const link = d3.select('svg#treeSVG').selectAll(".templink").data(data)

      // link.enter().append("path")
      // .attr("class", "templink")
      // .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x))
      // .attr('pointer-events', 'none');

      link.enter().append('line').attr('class', 'templink')
        .attr("x1", src.x)
        .attr("y1", src.y)
        .attr("x2", tgt.x*k + dx)
        .attr("y2", tgt.y*k + dy)
        .attr('pointer-events', 'none')

      link.attr("x1", src.x)
        .attr("y1", src.y)
        .attr("x2", tgt.x)
        .attr("y2", tgt.y)
        .attr('pointer-events', 'none')

      link.exit().remove()
    } else {
      const link = d3.select('svg#treeSVG').selectAll(".templink").data(data)
      link.exit().remove()
    }

  }

  dragstart = d => {
    d3.event.sourceEvent.stopPropagation()

    this.renderer.setBehaviour('nodeDrag', false)
    console.log(d)
    this.draggingNodeID = d
    const coords= d3.mouse(this.svg.node());
    this.anchor = {x: coords[0], y: coords[1]}


    // const node = d3.select('#node' + d)
    // node.attr('pointer-events', 'none')
    // node.select('.ghostCircle').attr('pointer-events', 'none');
    // d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
    // node.attr('class', 'node activeDrag');

    this.updateLink()
  }

  dragmove = d => {
    this.updateLink()
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
    console.log(this.selectedNodeID, this.draggingNodeID)
    if (this.selectedNodeID != null && this.draggingNodeID !== this.selectedNodeID) {
      if (!this.graph.hasEdge(this.selectedNodeID, this.draggingNodeID)) {
        if (this.graph.hasEdge(this.draggingNodeID, this.selectedNodeID)) {
          this.renderer.dispatchError('Link already exists.')
        }
        this.graph.setEdge(this.draggingNodeID, this.selectedNodeID)
      } else {
        this.renderer.dispatchError('Link could not be created, would create loop.')
      }
    }

    this.anchor = null
    this.selectedNodeID = null
    this.draggingNodeID = null
    this.updateLink()

    this.renderer.render(this.graph)
    this.renderer.setBehaviour('nodeDrag', true)
  }

}
