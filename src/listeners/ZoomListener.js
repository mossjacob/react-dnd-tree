import * as d3 from 'd3'

export default class ZoomListener {
  call() {
    return d3.zoom().on("zoom", function (e) {
      const transform = d3.zoomTransform(this);
      d3.select("svg g")
        .attr("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")")

    })

  }
}
