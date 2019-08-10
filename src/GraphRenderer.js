import * as d3 from 'd3'
import * as dagreD3 from 'dagre-d3'

export const NEW_EDGE = 'NEW_EDGE'
export const DELETE_EDGE = 'DELETE_EDGE'

export default class GraphRenderer {

  constructor(element, tree) {
    this.element = element
    this.tree = tree
    this.dagreRenderer = new dagreD3.render()
    this.behaviours = { edgeDraw: true, nodeDrag: true }
  }

  setBehaviour(behaviour, active) {
    this.behaviours[behaviour] = active
  }

  isBehaviourActive(behaviour) {
    return this.behaviours[behaviour]
  }

  removeEdge(edge) {
    let edges = this.tree.state.edges
    edges = edges.filter(e => e.from != edge.v || e.to != edge.w)
    console.log(edges)
    this.tree.setState({ edges }, () => {
      this.tree.getGraph().removeEdge(edge)
      this.tree.dispatchUpdate({ type: DELETE_EDGE, data: {from: edge.v, to: edge.w} })
    })
  }

  setEdge(from, to) {
    this.tree.setState({edges: [...this.tree.state.edges, {from, to}]}, () => {
      this.tree.dispatchUpdate({ type: NEW_EDGE, data: {from, to} })
    })
  }

  setSelectedNode(node) {
    this.tree.onNodeSelected(this.tree.getGraph().node(node))
  }

  dispatchError(errorMsg) {
    this.tree.dispatchError(errorMsg)
  }

  render(graph) {
    this.dagreRenderer(this.element, graph)

    this.tree.updateHandlers()
  }
}
