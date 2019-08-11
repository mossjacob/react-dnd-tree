/*
*/

import React, { Component } from 'react'
import * as d3 from 'd3'
import * as dagreD3 from 'dagre-d3'

import ZoomListener from './listeners/ZoomListener'
import DragListener from './listeners/DragListener'
import GraphRenderer from './GraphRenderer'
import EdgeDraw from './listeners/EdgeDraw'


export default class DnDTree extends Component {

  constructor(props, context) {
    super(props, context)
    this.selectedNode = null
    this.selectedEdge = null
    this.state = {
      nodes: props.nodes,
      edges: props.edges
    }
    this.onNodeSelected = props.onNodeSelected || (() => {})
    this.edgeTypes = { curve: d3.curveBasis, line: d3.curveBundle.beta(0) };

  }

  static defaultProps = {
    edgeType: 'curve',
    height: 400,
    edgeDraw: true,
  };


  overCircle = (d)  => {
    console.log("over " + d)
    this.selectedNode = this.graph.node(d)
    this.dragListener.setSelectedNode(this.selectedNode)
  }

  outCircle = (d) => {
    this.selectedNode = null
    this.dragListener.setSelectedNode(null)
  }

  updateHandlers = () => {
    d3.selectAll("#treeSVG g.edgePath path")
      .attr("id", function (e) {
        return `edgepath${e.v}-${e.w}`
      })
      .on('click', (edge) => {
        d3.event.stopPropagation()
        if (this.selectedEdge != null) {
          d3.select(`#edgepath${this.selectedEdge.v}-${this.selectedEdge.w}`).attr('class', '')
        }
        this.selectedEdge = edge
        d3.select(`#edgepath${edge.v}-${edge.w}`).attr('class', 'pathSelected')
      })

    const allNodes = this.svg.selectAll("g.node:not(.rendered)")
          .attr("id", function (d) {
            return "node" + d;
          })
          .attr('class', function(x) {
            return d3.select(this).attr('class') + ' rendered'
          })
    allNodes
      .append("circle")
      .attr('class', 'ghostCircle')
      .attr("r", 40)
      .attr("opacity", 0.2)
      .style("fill", "red")
      .attr('pointer-events', 'all')
      .on("mouseover", node => {
        this.overCircle(node)
      })
      .on("mouseout", node => {
        this.outCircle(node)
      })
    allNodes.call(this.dragListener.call())

    if (this.props.edgeDraw) {
      allNodes
        .on('mouseover', node => {
          d3.selectAll(`#notchUp${node}`).attr('class', 'notchShow')
          d3.selectAll(`#notchDown${node}`).attr('class', 'notchShow')
          this.edgeDraw.setSelectedNode(node)
        })
        .on('mouseout', node => {
          d3.selectAll(`#notchUp${node}`).attr('class', 'notchHide')
          d3.selectAll(`#notchDown${node}`).attr('class', 'notchHide')
          this.edgeDraw.setSelectedNode(null)
        })
      allNodes
        .append('circle')
        .attr('r', 5)
        .attr('id', d => `notchDown${d}`)
        .attr('class', 'notchHide')
        .style('fill', 'yellow')
        .attr('transform', function(d) {
          const { height } = this.parentNode.getBBox()
          return `translate(0, ${height/2})`
        })
        .call(this.edgeDraw.call('DOWN'))
      allNodes.append('circle')
        .attr('r', 5)
        .attr('id', d => `notchUp${d}`)
        .style('fill', 'yellow')
        .attr('class', 'notchHide')
        .attr('transform', function(d) {
          const { height } = this.parentNode.getBBox()
          return `translate(0, ${-height/2})`
        })
        .call(this.edgeDraw.call('UP'))

    }
    this.graph.nodes().forEach(v => {
      var node = this.graph.node(v)
      node.customId = v
    })
    this.graph.edges().forEach(e => {
      var edge = this.graph.edge(e.v, e.w)
      edge.customId = `edge${e.v}-${e.w}`
    })
  }

  dispatchError(errorMsg) {
    if (this.props.errorHandler) {
      this.props.errorHandler(errorMsg)
    }
  }

  dispatchUpdate(update) {
    if (this.props.updateHandler) {
      this.props.updateHandler(this.state.nodes, this.state.edges, update)
    }
  }

  updateGraph() {
    const { nodes, edges } = this.props

    for (let node of nodes) {
      this.graph.setNode(node.serverId, node)
    }
    // while (counter < 20) {
    //   this.graph.removeNode(counter)
    //   counter++
    // }

    this.graph.nodes().forEach(v => {
      var node = this.graph.node(v)
      node.rx = node.ry = 5
    });

    for (let edge of edges) { // set curve: d3.curveBundle.beta(0) for straight line
      this.graph.setEdge(edge.from, edge.to, {
        arrowhead: 'vee',
        curve: this.props.edgeType in this.edgeTypes ? this.edgeTypes[this.props.edgeType] : undefined
      })
    }

  }

  getGraph = () => this.graph

  centerGraph(zoom) {
    let w = this.svg.node().getBBox().width/2
    let h = this.svg.node().getBBox().height/2
    const t = d3.zoomIdentity.translate(w, h).scale(1)
    this.svg.call(zoom.transform, t)
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodes != prevProps.nodes) {

      const deletionNodes = prevProps.nodes.map(n => n.serverId).diff(
        this.props.nodes.map(n => n.serverId)
      )
      for (let node of deletionNodes) {
        this.graph.removeNode(node)
      }
      this.renderer.render(this.graph)

    }
  }

  createGraph() {
    this.graph = new dagreD3.graphlib.Graph()
    this.graph.setGraph({})
    this.graph.setDefaultEdgeLabel(function() { return {}; })
  }
  componentDidMount() {
    const { height, nodes, edges } = this.state

    document.addEventListener('keydown', event => {
      if (event.key == 'Delete' || event.key == 'Backspace') {
        if (this.selectedEdge) {
          this.renderer.removeEdge(this.selectedEdge)
          this.selectedEdge = null
          this.renderer.render(this.graph)
        }
      }
    })

    this.svg = d3.select("#tree-container")
      .append("svg")
      .on('click', () => {
        if (this.selectedEdge != null) {
          d3.select(`#edgepath${this.selectedEdge.v}-${this.selectedEdge.w}`).attr('class', '')
        }
        this.selectedEdge = null
      })
      .attr('id', 'treeSVG')
      .attr("width", '100%')
      .attr("height", '100%')
      .style("font", "10px sans-serif")



    this.createGraph()


    // Set up an SVG group so that we can translate the final graph.
    var svg = this.svg,
        inner = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.9)
        .attr("stroke-width", 1.5);

    // Create the renderer
    this.renderer = new GraphRenderer(this.svg.select('g'), this) //new dagreD3.render();
    this.dragListener = new DragListener(this.graph, this.renderer)
    this.edgeDraw = new EdgeDraw(this.graph, this.renderer)

    this.updateGraph()

    // Set up zoom support
    const zoom = new ZoomListener().call()
    svg.call(zoom)

    // Add transition
    this.graph.graph().transition = function transition(selection) {
      return selection.transition().duration(700)
    }

    this.renderer.render(this.graph)

    // Center the graph
    this.centerGraph(zoom)

    // Set handlers for nodes and edges
    this.updateHandlers()

    this.renderer.render(this.graph)
  }

  render() {
    if (this.renderer) {
      this.updateGraph()
      this.renderer.render(this.graph)
      console.log('render')
    }
    return (
      <div id='#container' className='container'>
        <style>{`
  .container {
    height: ${this.props.height}px
  }
	.node {
    cursor: pointer;
    fill: white;
  }

  .overlay{
      background-color:#EEE;
  }

  .node circle {
    fill: #fff;
    stroke: steelblue;
    stroke-width: 1.5px;
  }

  .node text {
    font-size:10px;
    font-family:sans-serif;
    stroke: none;
    fill: black;
  }
  .pathSelected {
    stroke: red;
  }
  .edgePath {
    fill: black;
    stroke-width: 2px;
    cursor: pointer;
  }
  .templink, .tempnotchlink {
    fill: none;
    stroke: red;
    stroke-width: 3px;
  }

  .ghostCircle.show{
      display:block;
  }
  .notchShow {
    display: block;
  }
  .notchHide {
    display: none
  }
  .ghostCircle, .activeDrag .ghostCircle{
    display: none;
  }
  .edgeHidden {
    display: none;
  }
        `}
        </style>
        <div id="tree-container" className='container'></div>
      </div>
    )
  }
}
