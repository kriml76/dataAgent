/*
 * Copyright 2026 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import type { ResultData, ChartAxis, ChartTypes } from './charts/types';
import { EXTENDED_COLORS } from './charts/types';
import './ChatChartComponent.css';

interface ChatChartComponentProps {
  resultData: ResultData;
}

const ChatChartComponent: React.FC<ChatChartComponentProps> = ({ resultData }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const chartConfig = useMemo(() => {
    const chartType = (resultData.displayStyle?.type as ChartTypes) || 'bar';
    const chartTitle = resultData.displayStyle?.title || '数据可视化';
    const columns = resultData?.resultSet?.column || [];
    const data = resultData?.resultSet?.data || [];

    // 构建坐标轴配置
    const axes: ChartAxis[] = [];

    if (resultData.displayStyle?.x) {
      axes.push({
        name: resultData.displayStyle.x,
        value: resultData.displayStyle.x,
        type: 'x',
      });
    }

    if (resultData.displayStyle?.y && Array.isArray(resultData.displayStyle.y)) {
      resultData.displayStyle.y.forEach((yField) => {
        axes.push({
          name: yField,
          value: yField,
          type: 'y',
        });
      });
    }

    // 默认使用前两列作为坐标轴
    if (axes.length === 0 && columns.length > 0) {
      axes.push({
        name: columns[0],
        value: columns[0],
        type: 'x',
      });

      if (columns.length > 1) {
        axes.push({
          name: columns[1],
          value: columns[1],
          type: 'y',
        });
      }
    }

    return { chartType, chartTitle, axes, data };
  }, [resultData]);

  const getChartOption = () => {
    const { chartType, chartTitle, axes, data } = chartConfig;

    const xAxis = axes.find((a) => a.type === 'x');
    const yAxes = axes.filter((a) => a.type === 'y');

    const xData = data.map((item) => item[xAxis?.value || '']);

    // 饼图特殊处理
    if (chartType === 'pie') {
      const nameField = xAxis?.value || axes[0]?.value || '';
      const valueField = yAxes[0]?.value || axes[1]?.value || '';

      return {
        title: {
          text: chartTitle,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 500,
          },
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'horizontal',
          bottom: 10,
          type: 'scroll',
        },
        color: EXTENDED_COLORS,
        series: [
          {
            name: chartTitle,
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}: {c}',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold',
              },
            },
            labelLine: {
              show: true,
            },
            data: data.map((item, index) => ({
              value: item[valueField],
              name: item[nameField],
            })),
          },
        ],
      };
    }

    // 折线图/柱状图配置
    const series = yAxes.map((y, index) => ({
      name: y.name,
      type: chartType === 'line' ? 'line' : 'bar',
      data: data.map((item) => item[y.value]),
      smooth: chartType === 'line',
      itemStyle: {
        color: EXTENDED_COLORS[index % EXTENDED_COLORS.length],
      },
    }));

    return {
      title: {
        text: chartTitle,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: yAxes.map((y) => y.name),
        bottom: 10,
        type: 'scroll',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: {
          rotate: xData.length > 10 ? 30 : 0,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
      },
      color: EXTENDED_COLORS,
      series,
    };
  };

  useEffect(() => {
    if (!chartRef.current || !resultData?.resultSet?.data?.length) return;

    // 销毁现有实例
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }

    const chart = echarts.init(chartRef.current);
    chartInstanceRef.current = chart;

    const option = getChartOption();
    chart.setOption(option);

    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [resultData, getChartOption]);

  return <div ref={chartRef} className="chart-container" />;
};

export default ChatChartComponent;
