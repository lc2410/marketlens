import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import GenericChart from "../common/GenericChart";
import "./LineChart.css";

Chart.register(...registerables);

/**
 * Renders a simple line chart for visualizing historical closing prices.
 * The line color adapts based on the overall trend direction (positive/negative).
 */
export default function LineChart({
  data,
  isPositive,
  theme = "dark",
  chartTitle,
  chartSubtitlePrice,
  viewState,
}) {
  if (!data) return null;

  const isDark = theme === "dark";
  const posHex = isDark ? "#059669" : "#34d399";
  const negHex = isDark ? "#dc2626" : "#f87171";

  const color = isPositive ? posHex : negHex;

  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.05)";
  const textColor = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";

  const lineData = data.history.map((close, i) => ({
    x: new Date(data.dates[i].replaceAll("-", "/")).valueOf(),
    y: close,
  }));

  // Calculate dynamic Y-axis bounds based on visible data
  let visibleMin = Infinity;
  let visibleMax = -Infinity;

  if (viewState?.min && viewState?.max) {
    lineData.forEach((d) => {
      if (d.x >= viewState.min && d.x <= viewState.max) {
        if (d.y < visibleMin) visibleMin = d.y;
        if (d.y > visibleMax) visibleMax = d.y;
      }
    });
  }

  // Fallback to overall min/max if no data in view or viewState not set
  if (visibleMin === Infinity) visibleMin = Math.min(...data.history);
  if (visibleMax === -Infinity) visibleMax = Math.max(...data.history);

  const yMin = Math.floor(visibleMin * 0.995);
  const yMax = Math.ceil(visibleMax * 1.005);

  const config = {
    type: "line",
    data: {
      datasets: [
        {
          data: lineData,
          borderColor: color,
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 10, bottom: 10, left: 0, right: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          displayColors: false,
          callbacks: {
            title: (items) =>
              new Date(items[0].raw.x).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
            label: (item) => {
              const price = Number.parseFloat(item.raw.y).toFixed(2);
              return `Closed Price: $${price}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "time",
          bounds: "data",
          time: { tooltipFormat: "MMM d, yyyy" },
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 45,
            font: { size: 11 },
          },
          min: viewState?.min,
          max: viewState?.max,
        },
        y: {
          display: true,
          position: "left",
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: (value) =>
              "$" +
              value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
          },
          min: yMin,
          max: yMax,
        },
      },
      animation: { duration: 0 },
    },
  };

  const chartLegend = (
    <div className="line-chart-legend-container">
      <div className="line-chart-legend-item">
        <div
          className="line-chart-legend-swatch"
          style={{ backgroundColor: color }}
        ></div>
        <span>
          <strong>Solid Line:</strong> Closing Price
        </span>
      </div>
    </div>
  );

  return (
    <GenericChart
      config={config}
      updateTrigger={[data, isPositive, theme, viewState]}
      className="line-chart-wrapper"
      chartTitle={chartTitle}
      chartSubtitlePrice={chartSubtitlePrice}
      chartLegend={chartLegend}
    />
  );
}
