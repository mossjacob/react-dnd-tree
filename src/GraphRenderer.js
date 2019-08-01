import * as d3 from 'd3'
import * as dagreD3 from 'dagre-d3'

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

  dispatchError(errorMsg) {
    this.tree.dispatchError(errorMsg)
  }

  render(graph) {
    this.dagreRenderer(this.element, graph)

    this.tree.updateHandlers()
  }
}
