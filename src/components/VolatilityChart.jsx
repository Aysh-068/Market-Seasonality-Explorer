import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, zoomPlugin)

export default function VolatilityChart({ data, metric }) {
  const chartData = {
    labels: data.map(d => new Date(d.time).toLocaleDateString()),
    datasets: [
      {
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data: data.map(d => d[metric]),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        tension: 0.3,
        pointRadius: 3
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x'
        },
        pan: {
          enabled: true,
          mode: 'x'
        }
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  return <Line data={chartData} options={options} />
}
