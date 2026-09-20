import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  Title,
} from "chart.js";
import "chartjs-adapter-date-fns";
import annotationPlugin from "chartjs-plugin-annotation";
import GenericChart from "../common/GenericChart";
import "./PriceChart.css";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  Title,
  annotationPlugin,
);

// Renders the main price chart using Chart.js, overlaying historical data, projections, and expected bounds
export default function PriceChart({ data, theme, viewState, onChartReady }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !viewState) return;
    chartRef.current.options.scales.x.min = viewState.min;
    chartRef.current.options.scales.x.max = viewState.max;
    chartRef.current.update("none");
  }, [viewState]);

  if (!data) return null;

  const isDark = theme === "dark";
  const colors = {
    brandRGB: isDark ? "168, 85, 247" : "16, 185, 129",
    history: isDark ? "#ffffff" : "#000000",
    grid: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    text: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
  };

  const anchorDate = data.Chart_History.dates.at(-1);

  const allDatesSet = new Set([
    ...data.Chart_History.dates,
    ...(data.Train_Fit_Dates || []),
    ...(data.Chart_Future_Dates || []),
  ]);
  const allDates = Array.from(allDatesSet).sort(
    (a, b) => new Date(a.replaceAll("-", "/")) - new Date(b.replaceAll("-", "/"))
  );

  const histMap = new Map();
  data.Chart_History.dates.forEach((d, i) => histMap.set(d, data.Chart_History.prices[i]));

  const projMap = new Map();
  if (data.Train_Fit_Dates) {
    data.Train_Fit_Dates.forEach((d, i) => projMap.set(d, data.Train_Fit_Prices[i]));
  }
  if (data.Chart_Future_Dates) {
    data.Chart_Future_Dates.forEach((d, i) => projMap.set(d, data.Chart_Future_Prices[i]));
  }

  const upperMap = new Map();
  upperMap.set(anchorDate, data.Chart_History.prices.at(-1));
  if (data.Chart_Future_Dates) {
    data.Chart_Future_Dates.forEach((d, i) => upperMap.set(d, data.Chart_Future_Upper[i]));
  }

  const lowerMap = new Map();
  lowerMap.set(anchorDate, data.Chart_History.prices.at(-1));
  if (data.Chart_Future_Dates) {
    data.Chart_Future_Dates.forEach((d, i) => lowerMap.set(d, data.Chart_Future_Lower[i]));
  }

  const historyCoords = allDates.map((d) => ({ x: d, y: histMap.has(d) ? histMap.get(d) : null }));
  const unifiedCoords = allDates.map((d) => ({ x: d, y: projMap.has(d) ? projMap.get(d) : null }));
  const upperCoords = allDates.map((d) => ({ x: d, y: upperMap.has(d) ? upperMap.get(d) : null }));
  const lowerCoords = allDates.map((d) => ({ x: d, y: lowerMap.has(d) ? lowerMap.get(d) : null }));

  // Calculate dynamic Y-axis bounds based on visible data across all datasets
  const allCoords = [
    ...historyCoords,
    ...unifiedCoords,
    ...upperCoords,
    ...lowerCoords,
  ];

  let visibleMin = Infinity;
  let visibleMax = -Infinity;

  if (viewState?.min && viewState?.max) {
    allCoords.forEach((c) => {
      if (c.y !== null && c.y !== undefined) {
        const ts =
          typeof c.x === "string"
            ? new Date(c.x.replaceAll("-", "/")).getTime()
            : c.x;
        if (ts >= viewState.min && ts <= viewState.max) {
          if (c.y < visibleMin) visibleMin = c.y;
          if (c.y > visibleMax) visibleMax = c.y;
        }
      }
    });
  }

  if (visibleMin === Infinity) {
    const validY = allCoords.map((c) => c.y).filter((y) => y !== null && y !== undefined);
    visibleMin = Math.min(...validY);
    visibleMax = Math.max(...validY);
  }

  const yMin = Math.floor(visibleMin * 0.995);
  const yMax = Math.ceil(visibleMax * 1.005);

  const config = {
    type: "line",
    data: {
      datasets: [
        {
          label: "Historical Stock Prices",
          data: historyCoords,
          backgroundColor: colors.history,
          borderColor: colors.history,
          borderWidth: 1.5,
          pointRadius: 2,
          pointHitRadius: 10,
          pointHoverRadius: 5,
          order: 1,
        },
        {
          label: "Projected Stock Prices",
          data: unifiedCoords,
          borderColor: `rgba(${colors.brandRGB}, 1)`,
          backgroundColor: `rgba(${colors.brandRGB}, 0.4)`,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 10,
          pointHoverRadius: 5,
          tension: 0.2,
          order: 0,
        },
        {
          label: "Upper Bound",
          data: upperCoords,
          backgroundColor: `rgba(${colors.brandRGB}, 0.3)`,
          borderColor: "transparent",
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHitRadius: 5,
          fill: "+1",
          tension: 0.3,
          order: 2,
        },
        {
          label: "Lower Bound",
          data: lowerCoords,
          borderColor: "transparent",
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHitRadius: 0,
          fill: false,
          tension: 0.3,
          order: 2,
        },
      ],
    },
    options: {
      color: colors.text,
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { intersect: false, mode: "index" },
      scales: {
        x: {
          type: "time",
          bounds: "data",
          min: viewState?.min,
          max: viewState?.max,
          time: { tooltipFormat: "MMM d, yyyy" },
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            maxRotation: 45,
            minRotation: 45,
            font: { size: 11 },
          },
        },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            font: { size: 11 },
            callback: (v) => `$${v.toLocaleString()}`,
          },
          min: yMin,
          max: yMax,
        },
      },
      plugins: {
        title: { display: false },
        legend: { display: false },
        annotation: {
          annotations: {
            todayLine: {
              type: "line",
              xMin: anchorDate,
              xMax: anchorDate,
              borderColor: colors.text,
              borderDash: [5, 4],
              label: {
                display: true,
                content: "Today",
                position: "start",
                font: { size: 10 },
                backgroundColor: isDark ? "#f8fafc" : "#0f172a",
                color: isDark ? "#0f172a" : "#f8fafc",
              },
            },
          },
        },
        tooltip: {
          filter: function (tooltipItem, currentIndex, tooltipItems) {
            const label = tooltipItem.dataset.label;
            if (label === "Lower Bound") return false;
            for (let i = 0; i < currentIndex; i++) {
              if (tooltipItems[i].datasetIndex === tooltipItem.datasetIndex)
                return false;
            }
            return true;
          },
          callbacks: {
            label: (ctx) => {
              if (ctx.parsed.y === null || ctx.parsed.y === undefined) {
                return null;
              }

              if (ctx.dataset.label === "Upper Bound") {
                const hoverDate = ctx.raw.x;
                const ciIndex = data.Chart_Future_Dates.indexOf(hoverDate);
                if (ciIndex !== -1) {
                  const lo = data.Chart_Future_Lower[ciIndex].toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  );
                  const hi = data.Chart_Future_Upper[ciIndex].toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  );
                  return `Expected Range: $${lo} – $${hi}`;
                }
                return null;
              }

              const price = ctx.parsed.y.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              if (ctx.dataset.label !== "Projected Stock Prices") {
                return `${ctx.dataset.label}: $${price}`;
              }
              return `Projected Stock Price: $${price}`;
            },
          },
        },
      },
    },
  };

  const handleChartReady = (instance) => {
    chartRef.current = instance;
    if (onChartReady) onChartReady(instance);
  };

  const hasFuture =
    data.Chart_Future_Dates && data.Chart_Future_Dates.length > 0;

  const chartTitle = (
    <h2>
      {hasFuture
        ? "Closed Stock Price History & Forecast Trends with Expected Range"
        : "Closed Stock Price History"}
    </h2>
  );

  let chartSubtitlePrice = null;
  if (data.Chart_History?.prices?.length > 0) {
    const prices = data.Chart_History.prices;
    const latestPrice = prices.at(-1);
    let changeEl = null;
    if (prices.length > 1) {
      const prevPrice = prices.at(-2);
      const diff = latestPrice - prevPrice;
      const pct = (diff / prevPrice) * 100;
      const isPos = diff >= 0;
      const sign = isPos ? "+" : "-";
      changeEl = (
        <span className={`benchmark-change ${isPos ? "positive" : "negative"}`}>
          <span className="change-value">{sign}${Math.abs(diff).toFixed(2)}</span>
          <span className="change-pct">({isPos ? "+" : ""}{pct.toFixed(2)}%)</span>
        </span>
      );
    }
    chartSubtitlePrice = (
      <div className="benchmark-price-row price-chart-price-row">
        <span className="benchmark-price">
          <span className="price-label">Most Recent Closed Price:</span>
          <span className="price-value">${latestPrice.toFixed(2)}</span>
        </span>
        {changeEl}
      </div>
    );
  }

  const chartLegend = hasFuture ? (
    <div className="price-chart-legend-container">
      <div className="price-chart-legend-item">
        <div className="price-chart-legend-hist"></div>
        <span>Historical Stock Prices</span>
      </div>
      <div className="price-chart-legend-item">
        <div className="price-chart-legend-proj"></div>
        <span>Projected Stock Prices</span>
      </div>
      <div className="price-chart-legend-item">
        <div className="price-chart-legend-range"></div>
        <span>Expected Range</span>
      </div>
    </div>
  ) : (
    <div className="price-chart-legend-container">
      <div className="price-chart-legend-item">
        <div className="price-chart-legend-hist"></div>
        <span>Historical Stock Prices</span>
      </div>
    </div>
  );

  return (
    <GenericChart
      config={config}
      updateTrigger={[data, theme, viewState]}
      className="chart-box price-chart-wrapper"
      wrapperStyle={{ height: "600px" }}
      canvasId="priceChart"
      onChartReady={handleChartReady}
      chartTitle={chartTitle}
      chartSubtitlePrice={chartSubtitlePrice}
      chartLegend={chartLegend}
    />
  );
}
