/**
* @Author: eason
* @Date:   2017-04-05T15:16:55+08:00
* @Email:  uniquecolesmith@gmail.com
 * @Last modified by:   mark
 * @Last modified time: 2017-08-03T10:27:08+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

function formatter(params) {
  if (!Array.isArray(params)) return;
  const axisValueLabel = (params[0] || {}).axisValueLabel;

  return `
    ${axisValueLabel}<br />
    ${
      params.map(({
        color,
        seriesName,
        value,
      }) => `
        <span style="
          background-color: ${color};
          display: inline-block;
          width: 6px;
          height: 6px;
          line-height:
          6px;border-radius: 3px;">
        </span>
        ${seriesName}: ${value}<br />
      `).join('')
    }
  `;
}

function seriesCreator(series, option) {
  return series.map(e => ({
    type: 'bar',
    symbol: 'circle',
    smooth: true,
    stack: e.stackName,
    ...option.bar,
    ...e,
  }));
}

export default function (option, data = {}) {
  if (data.mock) {
    option = data.option ? data.option : option; // eslint-disable-line
    data = data.data; // eslint-disable-line
  }
  const { tooltip, yAxis } = option;
  const { legend, category: labels, series = [] } = data;
  return {
    ...option,
    color: Array.isArray(option.color) ? option.color : Object.values(option.color),
    dataZoom: Array.isArray(option.dataZoom) ? option.dataZoom : Object.values(option.dataZoom),
    legend: {
      ...option.legend,
      data: legend,
    },
    tooltip: {
      ...tooltip,
      formatter,
    },
    yAxis: {
      ...yAxis,
      data: labels || [],
    },
    series: seriesCreator(series, option),
  };
}
