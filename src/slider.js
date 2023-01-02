// Copyright 2022, J. Donald Tillman, all rights reserved.
//
// Custom SVG slider for the pole dancing app.
//
// Display values from -10 to +10.
// On a cubic curve for lots more sensitivity near zero.
// Value is the default setting.
// Render returns the setting to value.

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const svgStyle = `
  .label {
     font: 14px sans-serif;
   }
  .val {
     font: 14px sans-serif;
     text-anchor: end;
   }
  .tick {
     font: 11px sans-serif;
     text-anchor: middle;
     alignment-baseline: bottom;
   }
`;

const tickVals = [-10, -7, -5, -3, -2, -1, -.25, 0, .25, 1, 2, 3, 5, 7, 10];

export
const Slider = props => {
    const {label, width, onChange, value=0} = props;
    const knobRef = useRef();
    const valRef = useRef();
    const height = 70;
    const min = -10.0;
    const max = 10.0;

    // knob/slot endpoints
    const xmin = 170;
    const xmax = width - 20;

    const toPixels = v =>
          xmin + (xmax - xmin) * (v - min) / (max - min);
    
    const toValue = x =>
          min + (max - min) * (x - xmin) / (xmax - xmin);

    const curveScale = max * max;

    const curve = x =>
          x ** 3 / curveScale;

    const uncurve = x =>
          Math.sign(x) * (Math.abs(x * curveScale) ** (1/3));

    const y = 37;
    const xp = toPixels(uncurve(value));
    const knobw = 8;
    const knobh = 20;

    // move to x pixel value, and...
    const update = x => {
        knobRef.current.setAttribute('x', x - knobw / 2);
        const v = curve(toValue(x));
        valRef.current.textContent = v.toFixed(3);
        onChange && onChange(v);
    };

    const move = e => {
        const svg = knobRef.current.ownerSVGElement;
        const x = Math.max(xmin,
                           Math.min(xmax,
                                    e.clientX - svg.getBoundingClientRect().x));
        update(x);
    };

    // resets to value on render
    useEffect(() =>
        update(toPixels(uncurve(value))));

    const handlePointerStart = e => {
        e.preventDefault();
        move(e);
        const svg = knobRef.current.ownerSVGElement;
        svg.onmousemove = handlePointerMove;
        svg.onmouseup = handlePointerEnd;
        svg.onmouseleave = handlePointerEnd;
    };

    const handlePointerMove = e => {
        e.preventDefault();
        move(e);
    };

    const handlePointerEnd = e => {
        e.preventDefault();
        const svg = knobRef.current.ownerSVGElement;
        svg.onmousemove = null;
    };

    const ticks = tickVals.map((v, i) => {
        const x = toPixels(uncurve(v));
        return <g key={i}>
                   <line x1={x} y1={y} x2={x} y2={y - 10}
                         stroke="#444444" />;
                   <text x={x} y={y - 12} className="tick">
                       {v}
                   </text>
               </g>;
    });

    return <svg width={width}
                height={height}
                viewBox={[0, 0, width, height]}
                onMouseDown={handlePointerStart}>
               <style>
                   {svgStyle}
               </style>
               {ticks}
               <SliderSlot x={xmin}
                           y={y - 1}
                           width={xmax - xmin} />
               <SliderKnob x={xp - knobw/2}
                           y={y - knobh / 2}
                           width={knobw}
                           height={knobh}
                           ref={knobRef}/>
               <text x={6} y={y} className="label">
                   {label}
               </text>
               <text x={xmin - 20} y={y} className="val"
                     ref={valRef}>
               </text>
           </svg>;
};

const SliderSlot = styled.rect`
  height: 3px;
  rx: 1px;
  ry: 1px;
  fill: #eeeeee;
  stroke: #444444;
`;

const SliderKnob = styled.rect`
  rx: 1px;
  ry: 1px;
  fill: #333333;
  stroke: #000000;
  filter: drop-shadow(2px 2px 1px rgba(0, 0, 0, .4));
`;

