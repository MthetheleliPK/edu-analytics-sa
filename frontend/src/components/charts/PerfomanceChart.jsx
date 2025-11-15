import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export const PerformanceChart = ({ data, type = 'bar' }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Class Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      borderColor: dataset.borderColor || `hsl(${Math.random() * 360}, 70%, 50%)`,
      backgroundColor: dataset.backgroundColor || `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
    }))
  };

  return type === 'line' ? 
    <Line options={options} data={chartData} /> : 
    <Bar options={options} data={chartData} />;
};

export const ProgressChart = ({ data }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: 'Student Progress',
      data: data.values,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.1
    }]
  };

  return <Line options={options} data={chartData} />;
};