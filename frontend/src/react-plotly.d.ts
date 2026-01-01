declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { PlotParams } from 'plotly.js';

  export interface Figure {
    data: PlotParams['data'];
    layout?: PlotParams['layout'];
    frames?: PlotParams['frames'];
  }

  export interface PlotParamsWithData extends Omit<PlotParams, 'data'> {
    data: PlotParams['data'];
  }

  export default class Plot extends Component<PlotParamsWithData> {}
}


