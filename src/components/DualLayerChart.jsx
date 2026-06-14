import React from 'react';
import ReactECharts from 'echarts-for-react';

const DualLayerChart = ({ data, onDateSelect, selectedDate }) => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: { backgroundColor: '#475569' }
      },
      formatter: (params) => {
        let res = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].name}</div>`;
        params.forEach(p => {
          const val = p.seriesName === '累積採購支出' ? `$${p.value.toLocaleString()}` : `${p.value} Unit`;
          res += `<div style="display: flex; justify-content: space-between; gap: 20px;">
            <span style="color: ${p.color};">● ${p.seriesName}</span>
            <span style="font-weight: bold;">${val}</span>
          </div>`;
        });
        return res;
      }
    },
    legend: {
      data: ['累積採購支出', '單日採購量 (Buy)', '理論消耗量 (Sell)'],
      textStyle: { color: '#475569' },
      top: 0
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: [0, 1],
        filterMode: 'filter',
        bottom: 10,
        start: 0,
        end: 100,
        textStyle: { color: '#475569' },
        borderColor: '#e2e8f0'
      },
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 0,
        end: 100
      }
    ],
    grid: [
      {
        left: '5%',
        right: '5%',
        height: '35%',
        top: '8%'
      },
      {
        left: '5%',
        right: '5%',
        top: '55%',
        height: '30%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: data.map(item => item.date),
        gridIndex: 0,
        axisLabel: { show: false },
        axisTick: { show: false }
      },
      {
        type: 'category',
        data: data.map(item => item.date),
        gridIndex: 1,
        axisLabel: { color: '#475569' }
      }
    ],
    yAxis: [
      {
        name: '累計金額',
        type: 'value',
        gridIndex: 0,
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#475569' }
      },
      {
        name: '數量',
        type: 'value',
        gridIndex: 1,
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#475569' }
      }
    ],
    series: [
      {
        name: '累積採購支出',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: data.map(item => item.cumulativeCost),
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ]
          }
        },
        itemStyle: { color: '#3b82f6' },
        emphasis: {
          focus: 'series',
          itemStyle: { borderWidth: 2, borderColor: '#fff' }
        },
        markLine: selectedDate ? {
          symbol: ['none', 'none'],
          label: { show: true, position: 'start', formatter: '選擇日期' },
          lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
          data: [{ xAxis: selectedDate }]
        } : undefined
      },
      {
        name: '單日採購量 (Buy)',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.map(item => item.procQty),
        itemStyle: { color: '#10b981' },
        barMaxWidth: 20,
        markLine: selectedDate ? {
          symbol: ['none', 'none'],
          label: { show: false },
          lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
          data: [{ xAxis: selectedDate }]
        } : undefined
      },
      {
        name: '理論消耗量 (Sell)',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.map(item => item.consQty),
        itemStyle: { color: '#ef4444' },
        barMaxWidth: 20
      }
    ],
    axisPointer: {
      link: { xAxisIndex: 'all' }
    }
  };

  const onChartClick = (params) => {
    if (params.name && onDateSelect) {
      onDateSelect(params.name);
    }
  };

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '550px', width: '100%' }} 
      onEvents={{ 'click': onChartClick }}
      notMerge={true}
    />
  );
};

export default DualLayerChart;
