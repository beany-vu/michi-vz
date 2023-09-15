// X-axis
import * as d3 from "d3";

svg
  .append("g")
  .attr("class", "x-axis")
  .attr("transform", "translate(0," + (height - MARGIN.bottom) + ")")
  .call(
    d3.axisBottom(xScale).tickFormat((d) => {
      const numericValue = Number(d);
      return isNaN(numericValue) ? "Invalid" : d3.format("d")(numericValue);
    }),
  )
  .call((g) => g.select(".domain").attr("stroke-opacity", 1))
  .call((g) => g.select(".domain").remove())
  .call((g) => g.selectAll(".tick line").remove())
  .call((g) => g.selectAll(".tick line").remove());
