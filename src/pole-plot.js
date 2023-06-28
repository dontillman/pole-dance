// Copyright 2022, J. Donald Tillman, all rights reserved.
//
// An interactive root locus plot for the Pole Dance app.
// 

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';

const polePlotParams = {origx: 600,
                        origy: 220,
                        scale: 80,
                        minx: -4,
                        maxx: 1,
                        miny: -2,
                        maxy: 2};

const axisColor = '#666666';

const svgStyles = `
  .title {
     font: bold 15px sans-serif;
     fill: #222222;
     text-anchor: middle;
  }
     
  .label {
     font: 13px sans-serif;
     fill: #444444;
  }
  .tick {
     font: 11px sans-serif;
     text-anchor: middle;
     alignment-baseline: bottom;
   }
`;


// Pole plotting svg widget
// Call setPoles(poles, traces, poly) to update it.
export
const PolePlot = forwardRef((props, ref) => {
    const {width, onAddPole} = props;
    const height = 440;
    
    const [[poles, traces, poly], setState] = useState([[],[],[]]);

    const {origx, origy, scale, minx, maxx, miny, maxy} = polePlotParams;
    const svgRef = useRef();
    const responsePlotRef = useRef();

    const poleColor = '#aa3333';
    const traceColor = '#ccaaaa';

    useImperativeHandle(ref, () => ({
        setPoles: (poles, traces, poly) => {
            setState([poles, traces, poly]);
            // only display response if the roots on the left half
            const stable = poles.every(r => r[0] <= 0);
            responsePlotRef.current.setPoly(stable && poly);
        }}));

    const xaxis = [<line x1={(minx - 0.2) * scale} y1={0}
                         x2={(maxx + 0.2) * scale} y2={0}
                         stroke={axisColor}
                         key='xaxis'/>,
                   ...rangeInc(minx, maxx)
                   .filter(v => v)
                   .flatMap(v => {
                       const x = v * scale;
                       return [<line x1={x} y1={0} x2={x} y2={10}
                                     stroke={axisColor}
                                     key={`xl${v}`} />,
                               <text x={x} y={20}
                                     className="tick"
                                     key={`xt${v}`}>
                                   {v}
                               </text>];
                   })];

    const yaxis = [<line x1={0} y1={-(miny - 0.2) * scale}
                         x2={0} y2={-(maxy + 0.2) * scale}
                         stroke={axisColor}
                         key='yaxis'/>,
                   ...rangeInc(miny, maxy)
                   .filter(y => y)
                   .flatMap(v => {
                       const y = -v * scale;
                       return [<line x1={0} y1={y} x2={10} y2={y}
                                     stroke={axisColor}
                                     key={`yl${v}`} />,
                               <text x={20} y={y}
                                     className="tick"
                                     key={`yt${v}`} >
                                   {v}
                               </text>];
                   })];

    const handleMouseDown = e => {
        e.preventDefault();
        const p = svgEventPoint(svgRef.current, e);
        const x = p.x - origx;
        const y = p.y - origy;
        // only if the click is in this region
        if (minx * scale < x && y < scale && -scale < y) {
            onAddPole && onAddPole((p.x - origx) / scale);
        }
        return false;
    };

    return <svg width={width}
                height={height}
                viewBox={[0, 0, width, height]}
                onMouseDown={handleMouseDown}
                ref={svgRef} >
               <style>
                   {svgStyles}
               </style>
               <text x={width/2} y="20" className="title">
                   Root Locus Calculator
               </text>
               <text x="10" y="40" className="label">
                   Polynomial: {prettyPoly(poly)}
               </text>
               <text x="10" y="60" className="label">
                   Click on the pole plot to place real poles.
               </text>
               <g transform={`translate(${origx}, ${origy})`} >
                   <text x={-scale} y={-1.8 * scale}
                         className="label"
                         textAnchor="middle">
                       Pole Plot:
                   </text>
                   {xaxis}
                   {yaxis}                   
                   {traces.map((trace, i) =>
                       trace.map((p, j) =>
                           <rect x={scale * p[0]}
                                 y={scale * p[1]}
                                 width="1"
                                 height="1"
                                 fill={traceColor}
                                 key={`t${i},${j}`} />)) }
                   {poles.map((p, i) =>
                       <circle cx={scale * p[0]}
                               cy={scale * p[1]}
                               r={5}
                               fill={poleColor}
                               key={`p${i}`}/>)}
               </g>
               <g transform="translate(50, 290)">
                   <ResponsePlot ref={responsePlotRef} />
               </g>
           </svg>;
});


// "pp" means "points per"
const responsePlotParams = {octaves: 6,
                            dbMax: 20,
                            dbMin: -60,
                            ppo: 40,
                            ppdb: 1.5};

// Frequency response plot.
// Use setPoly(poly, poles) to plot anew.
const ResponsePlot = forwardRef((props, ref) => {
    const [poly, setPoly] = useState([1]);

    const {octaves, dbMax, dbMin, ppo, ppdb} = responsePlotParams;
    const minw = 2 ** (-octaves/2);
    const pvmax = 10 ** (-dbMin / 10);

    useImperativeHandle(ref, () => ({
        setPoly}));

    const dby = db => (dbMax - db) * ppdb;
    const y0 = dby(dbMin);
    const octMin = -octaves/2;
    const octx = o => o = (o - octMin) * ppo;

    const octAxis = [<line x1={octx(octMin)} y1={y0}
                           x2={octx(octMin + octaves)} y2={y0}
                           stroke={axisColor}
                           key={'oaxis'} />,
                     ...rangeInc(octMin, octMin + octaves)
                     .map(oct => {
                         const x = octx(oct);
                         return [<line x1={x} y1={y0} x2={x} y2={y0 + 8}
                                       stroke={axisColor}
                                       key={`ol${oct}`} />,
                                 <text x={x} y={y0 + 18}
                                       className="tick"
                                       key={`ot${oct}`} >
                                     {prettyOctave(oct)}
                                 </text>];
                     })];
    
    const dbAxis = [<line x1={0} y1={dby(dbMax)}
                          x2={0} y2={dby(dbMin)}
                          stroke={axisColor}
                          key={'dbaxis'} />,
                    ...rangeInc(dbMin, dbMax, 20)
                    .flatMap(db => {
                        const y = dby(db);
                        return [<line x1={0} y1={y} x2={-8} y2={y}
                                      stroke={axisColor}
                                      key={`dbl${db}`} />,
                                <text x={-20} y={y}
                                      className="tick"
                                      key={`dbt${y}`} >
                                    {(db) ? db : '0 dB'}
                                </text>];
                    })];

    // polyline takes a single string of x,y values
    const points = poly && rangeInc(0, octaves * ppo)
          .map(x => {
              // a sum for each phase
              const sums = [0, 0, 0, 0];
              const w = minw * Math.pow(2, x / ppo);
              poly.forEach((c, i) => sums[i % 4] += c * w ** i);
              const v = (sums[0] - sums[2]) ** 2 + (sums[1] - sums[3]) ** 2;
              // const yp = dby(-10 * Math.log10((Math.min(pvmax, v / poly[0] ** 2))));
              const yp = dby(-10 * Math.log10((Math.min(pvmax, v))));
              return `${x},${yp.toFixed(1)}`;
          })
          .join(' ');

    return <g>
               <style>
                   {`
               .tick {
                  font: 11px sans-serif;
                  text-anchor: middle;
                  alignment-baseline: bottom;
                }
               `}
               </style>
               <text x={-30} y={-15} className="label">
                   Calculated Frequency Response:
               </text>
               {octAxis}
               {dbAxis}
               {poly &&
                <polyline points={points}
                          stroke="black"
                          fill="none"/>}
           </g>;
});

const prettyOctave = oct => {
    if (0 < oct) {
        return `+${oct}`
    } else if (oct < 0) {
        return `${oct}`;
    }
    return 'Octaves';
}
        
const prettyPoly = poly => {
    const s = i => (1 < i) ? `s^${i}`
          : (i) ? 's'
          : '';
    return poly.map((c, i) => `${c.toFixed(2)}${s(i)}`)
        .reverse()
        .join(' + ');
}

// Why the hell isn't this built-in?
// No, it has to be handed down like folklore.
// Given a mouse event on an svg element, return the point (x,y
// values).
const svgEventPoint = (svg, e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
}

// cute functional/generator version of python's range
// but inclusive
var rangeInc = (from, to, step=1) => {
    return [...function*() {
        for (let i = from; i <= to; i += step) {
            yield i;
        }
    }()];
};

